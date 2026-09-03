import type { ApiId, ApiMeta } from './types';

/**
 * Every request path the Interaction Details page issues, in one place.
 *
 * Patterns are deliberately origin-agnostic (`*` prefix). `apiClient` is
 * created without a `baseURL`, so most calls are relative and resolve against
 * the page origin, while the interaction-svc call resolves against a host
 * computed at runtime from the login payload's `interaction.server.domain`.
 * A `*` prefix matches both without the scenarios needing to know either.
 */
/**
 * `import.meta.env` is injected by Vite and is therefore absent when this
 * module is loaded by plain Node — which `scripts/test-report.ts` does, to
 * read the catalog without spinning up Vite. The defaults below match `.env`.
 */
const env: Partial<ImportMetaEnv> = import.meta.env ?? {};

const DATA_ENGINE = env.VITE_DATA_ENGINE_API_BASE_PATH ?? '/data-engine';
const CMS = env.VITE_CMS_API_BASE_PATH ?? '/cms/configuration';
const INTERACTION_SVC = env.VITE_INTERACTION_SVC_API_BASE_PATH ?? '/interaction-svc/api';
const AMEYO = '/ameyorestapi';

export const ENDPOINTS: Record<ApiId, string> = {
  interactionList: `*${DATA_ENGINE}/v1/cc-list/:ccId/process-list/:processId/interactions`,
  assignedCampaigns: `*${AMEYO}/cc/campaigns/getAssigned`,
  assignedProcesses: `*${AMEYO}/cc/processes/getAssigned`,
  campaignQueues: `*${CMS}/hierarchyconfig/campaign/:campaignId/getAllAgentQueueDetailedByCampaign`,
  campaignDispositions: `*${AMEYO}/cc/dispositionCodes/getByCampaign`,
  campaignUsers: `*${CMS}/cc/:ccId/process/:processId/campaign/:campaignId/campaign-user`,
  interactionTimeline: `*${INTERACTION_SVC}/v1/cc-list/:ccId/process-list/:processId/interactions/:interactionId/interaction-timeline`,
  contactCenterUsers: `*${AMEYO}/cc/contactCenterUsers/getAllContactCenterUsers`,
  userCampaigns: `*${AMEYO}/cc/hybrid/campaigns/getAssignedByUserId`,
  customerInfo: `*${AMEYO}/cc/getCustomerInfosForCustomerId`,
  qaDenominator: `*${DATA_ENGINE}/cc-list/:ccId/process-list/:processId/campaigns/:campaignId/campaign-qa-parameter`,
  // The generated client hardcodes `/data-engine/api/v1/...` on top of the
  // configured `/data-engine` base path, so the segment really does repeat.
  interactionQaScores: `*${DATA_ENGINE}${DATA_ENGINE}/api/v1/cc-list/:ccId/process-list/:processId/campaigns/:campaignId/interactions-quality-analysis-scores`,
  // Opaque URLs taken verbatim from the row payload and prefixed with the
  // data-engine base path. The paths below match what the fixtures emit.
  voiceLogBlob: `*${DATA_ENGINE}/voice-logs/*`,
  chatTranscriptBlob: `*${DATA_ENGINE}/transcripts/*`,
  refreshToken: `*${AMEYO}/session/refreshToken`,
  logout: `*${AMEYO}/session/userLogout`,
  login: `*${AMEYO}/userLogin/login`,
  keepAlive: `*${AMEYO}/session/keepAliveWithPingPush`,
};

/** POST endpoints; everything else is a GET. */
export const POST_APIS: ReadonlySet<ApiId> = new Set<ApiId>([
  'refreshToken',
  'logout',
  'login',
  'keepAlive',
]);

export const API_META: Record<ApiId, ApiMeta> = {
  interactionList: {
    id: 'interactionList',
    docNumber: 1,
    label: 'Interaction list',
    backend: 'data-engine',
  },
  assignedCampaigns: {
    id: 'assignedCampaigns',
    docNumber: 2,
    label: 'Assigned campaigns',
    backend: 'ameyo',
  },
  assignedProcesses: {
    id: 'assignedProcesses',
    docNumber: 3,
    label: 'Assigned processes',
    backend: 'ameyo',
  },
  campaignQueues: {
    id: 'campaignQueues',
    docNumber: 4,
    label: 'Campaign queues',
    backend: 'cms',
  },
  campaignDispositions: {
    id: 'campaignDispositions',
    docNumber: 5,
    label: 'Campaign disposition codes',
    backend: 'ameyo',
  },
  campaignUsers: {
    id: 'campaignUsers',
    docNumber: 6,
    label: 'Campaign users',
    backend: 'cms',
  },
  interactionTimeline: {
    id: 'interactionTimeline',
    docNumber: 7,
    label: 'Interaction timeline',
    backend: 'interaction-svc',
  },
  contactCenterUsers: {
    id: 'contactCenterUsers',
    docNumber: 8,
    label: 'All contact-center users',
    backend: 'ameyo',
  },
  userCampaigns: {
    id: 'userCampaigns',
    docNumber: 9,
    label: 'Campaigns assigned by user',
    backend: 'ameyo',
  },
  customerInfo: {
    id: 'customerInfo',
    docNumber: 10,
    label: 'Customer info',
    backend: 'ameyo',
  },
  qaDenominator: {
    id: 'qaDenominator',
    docNumber: 11,
    label: 'QA denominator (unwired)',
    backend: 'data-engine',
  },
  interactionQaScores: {
    id: 'interactionQaScores',
    docNumber: 12,
    label: 'Interaction QA scores (unwired)',
    backend: 'data-engine',
  },
  voiceLogBlob: {
    id: 'voiceLogBlob',
    docNumber: null,
    label: 'Voice recording blob (out of doc scope)',
    backend: 'data-engine',
  },
  chatTranscriptBlob: {
    id: 'chatTranscriptBlob',
    docNumber: null,
    label: 'Chat transcript blob (out of doc scope)',
    backend: 'data-engine',
  },
  refreshToken: {
    id: 'refreshToken',
    docNumber: null,
    label: 'Token refresh (401 interceptor)',
    backend: 'ameyo',
  },
  logout: {
    id: 'logout',
    docNumber: null,
    label: 'Logout (session teardown)',
    backend: 'ameyo',
  },
  login: {
    id: 'login',
    docNumber: null,
    label: 'Login (mock-mode entry point)',
    backend: 'ameyo',
  },
  keepAlive: {
    id: 'keepAlive',
    docNumber: null,
    label: 'Session keep-alive ping',
    backend: 'ameyo',
  },
};

export const ALL_API_IDS = Object.keys(ENDPOINTS) as ApiId[];
