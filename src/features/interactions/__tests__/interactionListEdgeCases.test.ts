import { afterEach, describe, expect, it } from 'vitest';
import { apiClient } from '@/services/apiClient';
import { fetchInteractions } from '../asyncActions';
import { serveScenarios } from '@/test/msw/activeScenario';
import { paramValue, requestCount } from '@/test/msw/requestLog';
import { TEST_CAMPAIGN_ID, TEST_CC_ID, TEST_PROCESS_ID } from '@/test/fixtures/auth';
import { createConnectedStore } from '@/test/testStore';

/**
 * Layer 2: the interaction-list behaviours the doc flags as surprising, which
 * a status-code-only suite would miss entirely.
 */

const listArgs = {
  ccId: TEST_CC_ID,
  processId: TEST_PROCESS_ID,
  campaignIds: [TEST_CAMPAIGN_ID],
};

describe('#1 Interaction list — documented quirks', () => {
  it('IL-200-partial — a failed row inside a 200 is dropped silently', async () => {
    serveScenarios('IL-200-partial');
    const store = createConnectedStore();

    const result = await store.dispatch(fetchInteractions(listArgs));
    const state = store.getState().interactions;

    // The transport succeeded, so nothing surfaces as an error...
    expect(result.meta.requestStatus).toBe('fulfilled');
    expect(state.error).toBeNull();
    // ...but the server sent three entries and only two carried `data`.
    expect(state.rows).toHaveLength(2);
    // `metadata.count` still reports three, so the page is short and the
    // discrepancy is visible only by comparing the two numbers. Locked in
    // here so the silent drop is a documented behaviour, not a surprise.
    expect(state.currentPageCount).toBe(3);
  });

  describe('total_string parsing', () => {
    const cases = [
      ['IL-200', '2', 2],
      ['IL-200-total-many', 'many', -1],
      ['IL-200-total-plus', '1000+', 1000],
      ['IL-200-total-more-than', 'more than 1000', 1000],
      ['IL-200-next-page', '25000', 25000],
    ] as const;

    it.each(cases)('%s — %s parses to %i', async (scenarioId, totalString, expected) => {
      serveScenarios(scenarioId);
      const store = createConnectedStore();

      await store.dispatch(fetchInteractions(listArgs));

      const state = store.getState().interactions;
      expect(state.totalString).toBe(totalString);
      // -1 is the "unknown" signal that makes the pager hide its total badge.
      expect(state.totalRows).toBe(expected);
    });
  });

  it('IL-200-next-page — the next cursor is extracted and threaded back', async () => {
    serveScenarios('IL-200-next-page');
    const store = createConnectedStore();

    await store.dispatch(fetchInteractions(listArgs));
    const afterCursor = store.getState().interactions.afterCursor;
    expect(afterCursor).toBe('CURSOR_NEXT');

    // Feeding it back must reach the wire as `after_cursor`.
    await store.dispatch(fetchInteractions({ ...listArgs, afterCursor: afterCursor! }));
    expect(paramValue('interactionList', 'after_cursor', 1)).toBe('CURSOR_NEXT');
  });

  it('IL-200 — the last page reports no cursors at all', async () => {
    const store = createConnectedStore();

    await store.dispatch(fetchInteractions(listArgs));

    const state = store.getState().interactions;
    expect(state.beforeCursor).toBeNull();
    expect(state.afterCursor).toBeNull();
  });
});

describe('#1 Interaction list — sub-HTTP failure states', () => {
  const realTimeout = apiClient.defaults.timeout;
  const realAdapter = apiClient.defaults.adapter;
  const realBaseUrl = apiClient.defaults.baseURL;

  afterEach(() => {
    apiClient.defaults.timeout = realTimeout;
    apiClient.defaults.adapter = realAdapter;
    apiClient.defaults.baseURL = realBaseUrl;
  });

  it('IL-timeout — a slow response aborts the request and clears the grid', async () => {
    // Two deviations from production, both forced and neither affecting what
    // is asserted:
    //
    // 1. Timeout lowered from 30s to 50ms (scenario delays 300ms) so the
    //    suite doesn't wait half a minute.
    // 2. The fetch adapter instead of XHR. MSW's XMLHttpRequest interceptor
    //    does not implement the `timeout` property, so axios's `ontimeout`
    //    never fires and the request completes normally. The fetch adapter
    //    times out through AbortController, which MSW does honour. It needs
    //    an absolute URL, hence the temporary baseURL — and the data-engine
    //    prefix has to move onto it, because the generated client skips its
    //    own `basePath` whenever `axios.defaults.baseURL` is set.
    //
    // What matters downstream — an AxiosError with a timeout code, no
    // response, and a cleared grid — is identical either way.
    apiClient.defaults.timeout = 50;
    apiClient.defaults.adapter = 'fetch';
    apiClient.defaults.baseURL = `http://localhost:3000${
      import.meta.env.VITE_DATA_ENGINE_API_BASE_PATH
    }`;
    serveScenarios('IL-timeout');
    const store = createConnectedStore();

    const result = await store.dispatch(fetchInteractions(listArgs));

    expect(result.meta.requestStatus).toBe('rejected');
    const error = store.getState().interactions.error;
    expect(error?.code).toMatch(/ETIMEDOUT|ECONNABORTED/);
    expect(error?.message).toMatch(/timeout of \d+ms exceeded/);
    // No response ever arrived, so there is no status to report.
    expect(error?.response?.status).toBeUndefined();
    expect(store.getState().interactions.rows).toEqual([]);
  });

  it('IL-network — a transport failure is reported without a status', async () => {
    serveScenarios('IL-network');
    const store = createConnectedStore();

    const result = await store.dispatch(fetchInteractions(listArgs));

    expect(result.meta.requestStatus).toBe('rejected');
    const error = store.getState().interactions.error;
    expect(error?.code).toBe('ERR_NETWORK');
    expect(error?.response?.status).toBeUndefined();
    // A network failure clears the grid the same way a 500 does — the UI
    // cannot tell "server said no" from "never reached the server".
    expect(store.getState().interactions.rows).toEqual([]);
  });
});

describe('#1 Interaction list — request shape', () => {
  it('IL-200 — sends the documented defaults and repeats array params', async () => {
    const store = createConnectedStore();

    await store.dispatch(
      fetchInteractions({ ...listArgs, campaignIds: [42, 43], userIds: ['agent01'] }),
    );

    expect(requestCount('interactionList')).toBe(1);
    const params = paramValue.bind(null, 'interactionList');
    expect(params('state')).toBe('CLOSED');
    expect(params('sort_by')).toBe('date_added:desc');
    expect(params('limit')).toBe('50');
    // Repeated keys, not comma-joined.
    expect(paramValue('interactionList', 'campaign_id')).toBe('42');
    expect(paramValue('interactionList', 'user_id')).toBe('agent01');
  });

  it('IL-200 — date_range is sent in epoch seconds, not milliseconds', async () => {
    const store = createConnectedStore();
    const toMs = Date.UTC(2026, 7, 31, 0, 0, 0);
    const fromMs = toMs - 24 * 60 * 60 * 1000;

    await store.dispatch(
      fetchInteractions({ ...listArgs, fromEpochMs: fromMs, toEpochMs: toMs }),
    );

    expect(paramValue('interactionList', 'date_range')).toBe(
      `gte:${Math.floor(fromMs / 1000)};lte:${Math.floor(toMs / 1000)}`,
    );
  });
});
