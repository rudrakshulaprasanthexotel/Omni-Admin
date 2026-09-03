import type { ApiId, Scenario } from './types';
import { ALL_API_IDS } from './endpoints';
import { interactionListScenarios } from './interactionList';
import { assignedCampaignsScenarios } from './assignedCampaigns';
import { assignedProcessesScenarios } from './assignedProcesses';
import { campaignQueuesScenarios } from './campaignQueues';
import { campaignDispositionsScenarios } from './campaignDispositions';
import { campaignUsersScenarios } from './campaignUsers';
import { timelineScenarios } from './timeline';
import {
  contactCenterUsersScenarios,
  customerInfoScenarios,
  userCampaignsScenarios,
} from './hoverCards';
import { qaDenominatorScenarios, qaScoresScenarios } from './qa';
import { chatTranscriptScenarios, voiceLogScenarios } from './media';
import {
  keepAliveScenarios,
  loginScenarios,
  logoutScenarios,
  refreshTokenScenarios,
} from './authSupport';

/**
 * The single source of truth. Both the Vitest suite (`msw/node`) and the
 * `dev:mock` scenario switcher (`msw/browser`) build their handlers from this
 * list, so a new documented state costs exactly one entry here.
 */
export const SCENARIOS: Scenario[] = [
  ...interactionListScenarios,
  ...assignedCampaignsScenarios,
  ...assignedProcessesScenarios,
  ...campaignQueuesScenarios,
  ...campaignDispositionsScenarios,
  ...campaignUsersScenarios,
  ...timelineScenarios,
  ...contactCenterUsersScenarios,
  ...userCampaignsScenarios,
  ...customerInfoScenarios,
  ...qaDenominatorScenarios,
  ...qaScoresScenarios,
  ...voiceLogScenarios,
  ...chatTranscriptScenarios,
  ...refreshTokenScenarios,
  ...logoutScenarios,
  ...loginScenarios,
  ...keepAliveScenarios,
];

const byId = new Map<string, Scenario>();
for (const scenario of SCENARIOS) {
  if (byId.has(scenario.id)) {
    throw new Error(`Duplicate scenario id: ${scenario.id}`);
  }
  byId.set(scenario.id, scenario);
}

export function getScenario(id: string): Scenario | undefined {
  return byId.get(id);
}

export function scenariosForApi(api: ApiId): Scenario[] {
  return SCENARIOS.filter((scenario) => scenario.api === api);
}

/** The all-happy baseline: every API's `isDefault` scenario. */
export const DEFAULT_SCENARIOS: Record<ApiId, Scenario> = (() => {
  const defaults = {} as Record<ApiId, Scenario>;
  for (const api of ALL_API_IDS) {
    const found = SCENARIOS.find((scenario) => scenario.api === api && scenario.isDefault);
    if (!found) {
      throw new Error(`No default scenario declared for API "${api}"`);
    }
    defaults[api] = found;
  }
  return defaults;
})();

export * from './types';
export { ALL_API_IDS, API_META, ENDPOINTS, POST_APIS } from './endpoints';
