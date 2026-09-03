import { describe, expect, it } from 'vitest';
import { HttpResponse, delay, http, type JsonBodyType } from 'msw';
import { fetchCampaignQueues, fetchInteractions } from '../asyncActions';
import { ENDPOINTS } from '@/test/scenarios';
import { exceptionBody } from '@/test/scenarios/envelopes';
import { twoInteractionPage } from '@/test/fixtures/interactions';
import { campaignQueues } from '@/test/fixtures/directory';
import { serveScenarios } from '@/test/msw/activeScenario';
import { requestCount } from '@/test/msw/requestLog';
import { server } from '@/test/msw/server';
import {
  TEST_CAMPAIGN_ID,
  TEST_CC_ID,
  TEST_JWT,
  TEST_PROCESS_ID,
} from '@/test/fixtures/auth';
import { createConnectedStore, preloadedState } from '@/test/testStore';

/**
 * The 401 handling in `apiClient` — refresh single-flight, retry once, tear
 * the session down when the refresh itself fails. Only reachable with a real
 * HTTP layer: stubbing the API modules skips the interceptor entirely.
 */

const listArgs = {
  ccId: TEST_CC_ID,
  processId: TEST_PROCESS_ID,
  campaignIds: [TEST_CAMPAIGN_ID],
};

interface OnceProbe {
  calls: number;
  authHeaders: Array<string | null>;
}

/** Answers 401 on the first call and the happy body on every later one. */
function respondOnce401(endpoint: string, okBody: JsonBodyType): OnceProbe {
  const probe: OnceProbe = { calls: 0, authHeaders: [] };
  server.use(
    http.get(endpoint, ({ request }) => {
      probe.calls += 1;
      probe.authHeaders.push(request.headers.get('Authorization'));
      if (probe.calls === 1) {
        return HttpResponse.json(exceptionBody(401, 'Unauthorized'), { status: 401 });
      }
      return HttpResponse.json(okBody, { status: 200 });
    }),
  );
  return probe;
}

describe('401 handling in the response interceptor', () => {
  it('refreshes once and retries the original request', async () => {
    const probe = respondOnce401(ENDPOINTS.interactionList, twoInteractionPage());
    const store = createConnectedStore();

    const result = await store.dispatch(fetchInteractions(listArgs));

    expect(result.meta.requestStatus).toBe('fulfilled');
    expect(store.getState().interactions.rows).toHaveLength(2);
    // Original 401 plus exactly one retry.
    expect(probe.calls).toBe(2);
    expect(requestCount('refreshToken')).toBe(1);
  });

  it('drops the Authorization header on the retry — the refreshed JWT is never applied', async () => {
    const probe = respondOnce401(ENDPOINTS.interactionList, twoInteractionPage());
    const store = createConnectedStore();

    await store.dispatch(fetchInteractions(listArgs));

    expect(probe.authHeaders[0]).toBe(TEST_JWT);
    // `refreshAuthToken` reads `.jwtToken` off the thunk's return value, but
    // the thunk returns a `NormalisedAxiosResponse` envelope — the token is at
    // `.response.data.jwtToken`. So `newJwt` is `undefined`, and setting a
    // header to `undefined` removes it. The retry goes out unauthenticated and
    // survives only because the `sessionId` header carries it.
    //
    // Asserted as-is rather than as the intended behaviour: if the bug is
    // fixed, this test fails and points straight at the fix.
    expect(probe.authHeaders[1]).toBeNull();
    // The refresh itself did work and updated the shared default.
    expect(requestCount('refreshToken')).toBe(1);
  });

  it('shares one refresh across concurrent 401s (single-flight)', async () => {
    const listProbe = respondOnce401(ENDPOINTS.interactionList, twoInteractionPage());
    const queueProbe = respondOnce401(ENDPOINTS.campaignQueues, campaignQueues());
    // Hold the refresh open so both 401s land while it is still in flight —
    // otherwise the first could finish before the second even starts and two
    // refreshes would be legitimate. Counted locally: `server.use` overrides
    // replace the catalog handler, so they never reach the request log.
    let refreshCalls = 0;
    server.use(
      http.post(ENDPOINTS.refreshToken, async () => {
        refreshCalls += 1;
        await delay(50);
        return HttpResponse.json({ jwtToken: 'jwt-refreshed' }, { status: 200 });
      }),
    );
    const store = createConnectedStore();

    const [list, queues] = await Promise.all([
      store.dispatch(fetchInteractions(listArgs)),
      store.dispatch(fetchCampaignQueues(TEST_CAMPAIGN_ID)),
    ]);

    expect(list.meta.requestStatus).toBe('fulfilled');
    expect(queues.meta.requestStatus).toBe('fulfilled');
    expect(listProbe.calls).toBe(2);
    expect(queueProbe.calls).toBe(2);
    // The whole point: two 401s, one refresh.
    expect(refreshCalls).toBe(1);
  });

  it('retries only once — a second 401 is surfaced to the caller', async () => {
    // The catalog scenario answers 401 every time.
    serveScenarios('IL-401');
    const store = createConnectedStore();

    const result = await store.dispatch(fetchInteractions(listArgs));

    expect(result.meta.requestStatus).toBe('rejected');
    expect(store.getState().interactions.error?.response?.status).toBe(401);
    // Original plus one retry, then `_retry` blocks any further attempt.
    expect(requestCount('interactionList')).toBe(2);
    expect(requestCount('refreshToken')).toBe(1);
  });

  it('RT-401 — a failed refresh ends the session and logs out', async () => {
    serveScenarios('IL-401', 'RT-401');
    const store = createConnectedStore();
    expect(store.getState().auth.loginResponse).not.toBeNull();

    const result = await store.dispatch(fetchInteractions(listArgs));

    expect(result.meta.requestStatus).toBe('rejected');
    // Session torn down: logout called, then the login response cleared.
    expect(requestCount('logout')).toBe(1);
    expect(store.getState().auth.loginResponse).toBeNull();

    // What reaches the thunk is the unwrapped refresh failure — a plain
    // object, not an AxiosError — so it takes the non-axios fallback branch
    // and the 401 is lost. The grid shows a generic message.
    const error = store.getState().interactions.error;
    expect(error?.message).toBe('Failed to load interactions');
    expect(error?.response).toBeUndefined();
  });

  it('does not attempt a refresh when there is no session', async () => {
    serveScenarios('IL-401');
    // `hasSession` is false without a login response, so the interceptor
    // passes the 401 straight through.
    const store = createConnectedStore(preloadedState());

    const result = await store.dispatch(fetchInteractions(listArgs));

    expect(result.meta.requestStatus).toBe('rejected');
    expect(requestCount('interactionList')).toBe(1);
    expect(requestCount('refreshToken')).toBe(0);
    expect(store.getState().interactions.error?.response?.status).toBe(401);
  });
});
