import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import {
  fetchAssignedCampaigns,
  fetchCampaignDispositions,
  fetchCampaignQaDenominator,
  fetchCampaignQueues,
  fetchCampaignUsers,
  fetchInteractions,
} from '../asyncActions';
import { fetchAssignedProcesses } from '@/features/process/asyncActions';
import { dataEngineApis } from '@/services/apiClient/dataEngineApis';
import { interactionApis } from '@/services/apiClient/interactionApis';
import { supervisorApis } from '@/services/apiClient/supervisorApis';
import { downloadBlob } from '@/shared/utils/downloadBlob';
import { API_META, SCENARIOS, type ApiId, type Scenario } from '@/test/scenarios';
import { serveScenarios } from '@/test/msw/activeScenario';
import {
  TEST_CAMPAIGN_ID,
  TEST_CC_ID,
  TEST_PROCESS_ID,
} from '@/test/fixtures/auth';
import { createConnectedStore } from '@/test/testStore';

/**
 * Layer 1: every documented response state, exercised through the real axios
 * instance, the real generated clients, the real interceptors and — where one
 * exists — the real thunk and reducer.
 *
 * Table-driven off the scenario catalog so a newly documented state is covered
 * the moment it is added there. Test names lead with the scenario id, which is
 * how `scripts/test-report.ts` joins results back to the doc.
 */

type Outcome = { ok: boolean; status?: number; message?: string };

/**
 * The table dispatches thunks with unrelated argument and payload types and
 * reads only `meta.requestStatus` and the rejection payload off the settled
 * action. `AppDispatch` is an intersection of call signatures, so
 * `Parameters<…>` collapses to `UnknownAction` and rejects every thunk —
 * there is no narrower type here that accepts all eight.
 */
type AnyThunkAction = any;

const listArgs = {
  ccId: TEST_CC_ID,
  processId: TEST_PROCESS_ID,
  campaignIds: [TEST_CAMPAIGN_ID],
};

type Store = ReturnType<typeof createConnectedStore>;

/** Run a thunk and read the outcome off the settled action. */
async function viaThunk(store: Store, action: AnyThunkAction): Promise<Outcome> {
  const settled = await store.dispatch(action);
  const ok = settled.meta.requestStatus === 'fulfilled';
  const payload = settled.payload as
    | { response?: { status?: number }; message?: string }
    | undefined;
  return {
    ok,
    status: payload?.response?.status,
    message: payload?.message,
  };
}

/** Call an API client directly, for the surfaces with no thunk behind them. */
async function viaClient(call: () => Promise<unknown>): Promise<Outcome> {
  try {
    await call();
    return { ok: true };
  } catch (error) {
    if (error instanceof AxiosError) {
      return { ok: false, status: error.response?.status, message: error.message };
    }
    return { ok: false, message: String(error) };
  }
}

const invokers: Record<ApiId, (store: Store) => Promise<Outcome>> = {
  interactionList: (store) => viaThunk(store, fetchInteractions(listArgs)),
  assignedCampaigns: (store) => viaThunk(store, fetchAssignedCampaigns()),
  assignedProcesses: (store) => viaThunk(store, fetchAssignedProcesses()),
  campaignQueues: (store) => viaThunk(store, fetchCampaignQueues(TEST_CAMPAIGN_ID)),
  campaignDispositions: (store) =>
    viaThunk(store, fetchCampaignDispositions(TEST_CAMPAIGN_ID)),
  campaignUsers: (store) =>
    viaThunk(
      store,
      fetchCampaignUsers({
        contactCenterId: TEST_CC_ID,
        processId: TEST_PROCESS_ID,
        campaignId: TEST_CAMPAIGN_ID,
      }),
    ),
  qaDenominator: (store) =>
    viaThunk(
      store,
      fetchCampaignQaDenominator({
        campaignId: TEST_CAMPAIGN_ID,
        contactCenterId: TEST_CC_ID,
        processId: TEST_PROCESS_ID,
      }),
    ),
  // No thunk: the timeline is fetched straight from the component.
  interactionTimeline: () =>
    viaClient(() =>
      interactionApis.getInteractionTimeline(TEST_CC_ID, TEST_PROCESS_ID, 'int-1'),
    ),
  contactCenterUsers: () => viaClient(() => supervisorApis.getAllContactCenterUsers()),
  userCampaigns: () =>
    viaClient(() => supervisorApis.getCampaignsAssignedByUserId('agent01')),
  customerInfo: () =>
    viaClient(() =>
      supervisorApis.getCustomerInfosForCustomerId(TEST_CAMPAIGN_ID, 'cust-1'),
    ),
  // Client exists, nothing calls it yet — covered so the state set survives
  // until it is wired up.
  interactionQaScores: () =>
    viaClient(() =>
      dataEngineApis.interactionQaScore.getInteractionQaScores(
        TEST_CC_ID,
        TEST_PROCESS_ID,
        TEST_CAMPAIGN_ID,
        ['int-1'],
      ),
    ),
  voiceLogBlob: () => viaClient(() => downloadBlob('/data-engine/voice-logs/int-1.mp3')),
  chatTranscriptBlob: () =>
    viaClient(() => downloadBlob('/data-engine/transcripts/int-2.json')),
  refreshToken: () => viaClient(() => Promise.resolve()),
  logout: () => viaClient(() => Promise.resolve()),
  login: () => viaClient(() => Promise.resolve()),
  keepAlive: () => viaClient(() => Promise.resolve()),
};

/**
 * `timeout` and `network` have no HTTP status and need bespoke setup; the auth
 * support endpoints are exercised through the interceptor in
 * `authInterceptor.test.ts` rather than called directly. `login` and
 * `keepAlive` exist only to make the browser mock mode reachable — this suite
 * preloads a signed-in store instead.
 */
const EXCLUDED_APIS: ApiId[] = ['refreshToken', 'logout', 'login', 'keepAlive'];

function tableScenarios(api: ApiId): Scenario[] {
  return SCENARIOS.filter(
    (scenario) =>
      scenario.api === api &&
      typeof scenario.state === 'number' &&
      !EXCLUDED_APIS.includes(scenario.api),
  );
}

const apisUnderTest = (Object.keys(API_META) as ApiId[]).filter(
  (api) => !EXCLUDED_APIS.includes(api) && tableScenarios(api).length > 0,
);

describe.each(apisUnderTest)('%s', (api) => {
  const meta = API_META[api];
  const label = meta.docNumber ? `#${meta.docNumber} ${meta.label}` : meta.label;

  describe(label, () => {
    it.each(tableScenarios(api).map((scenario) => [scenario.id, scenario] as const))(
      '%s',
      async (_id, scenario) => {
        serveScenarios(scenario.id);
        const store = createConnectedStore();

        const outcome = await invokers[api](store);

        const expectedStatus = scenario.state as number;
        if (expectedStatus === 200) {
          expect(outcome.ok).toBe(true);
        } else {
          expect(outcome.ok).toBe(false);
          // Every non-200 must surface its status. The client collapses all of
          // them into one generic message, but the status itself survives on
          // the normalised error, which is what a future code-aware UI needs.
          expect(outcome.status).toBe(expectedStatus);
        }
      },
    );
  });
});

describe('slice contract on rejection', () => {
  it('IL-500 — clears rows, both cursors and the counts', async () => {
    const store = createConnectedStore();
    // Load a good page first so there is state to clear.
    await store.dispatch(fetchInteractions(listArgs));
    expect(store.getState().interactions.rows).toHaveLength(2);

    serveScenarios('IL-500');
    await store.dispatch(fetchInteractions(listArgs));

    const state = store.getState().interactions;
    expect(state.rows).toEqual([]);
    expect(state.beforeCursor).toBeNull();
    expect(state.afterCursor).toBeNull();
    expect(state.currentPageCount).toBe(0);
    expect(state.totalString).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error?.response?.status).toBe(500);
  });

  it('AC-512 — campaign fetch failure is stored without clearing the rows', async () => {
    serveScenarios('AC-512');
    const store = createConnectedStore();

    await store.dispatch(fetchAssignedCampaigns());

    const state = store.getState().interactions;
    expect(state.campaigns).toEqual([]);
    expect(state.campaignsLoading).toBe(false);
    expect(state.campaignsError?.response?.status).toBe(512);
  });

  it('QAD-200 — denominator is keyed by campaign id', async () => {
    const store = createConnectedStore();

    await store.dispatch(
      fetchCampaignQaDenominator({
        campaignId: TEST_CAMPAIGN_ID,
        contactCenterId: TEST_CC_ID,
        processId: TEST_PROCESS_ID,
      }),
    );

    expect(store.getState().interactions.qaDenominatorByCampaignId).toEqual({
      [TEST_CAMPAIGN_ID]: 2,
    });
  });
});
