import type { AxiosResponse } from 'axios';
import { apiClient } from '.';

/**
 * Contact-center Quality Analysis (CQA) REST wrapper. Provides AI-generated
 * scoring for interactions — surfaced on the Interaction Details Scoring
 * chip when the tenant has CQA enabled.
 *
 * The 6x GWT UI reaches CQA through `CQARestDispatcher` which resolves the
 * base URL as `AppUtils.getHostedServerUrl() + "/cqa"`. In this app we route
 * everything through the gateway path `/cqa` (proxied to the CQA host in
 * `vite.config.ts`), so callers don't need to know the CQA host directly.
 */

const CQA_BASE = `${import.meta.env.VITE_CQA_API_BASE_PATH ?? '/cqa'}/api/v1`;

export interface QualityAnalysisEntry {
  externalInteractionId: string;
  interactionId?: string;
  aiScore?: number;
  aiScoreMax?: number;
  model?: string;
  sentiment?: string;
  summary?: string;
  updatedAt?: string;
}

export interface QualityAnalysisResponse {
  items: QualityAnalysisEntry[];
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const cqaApis = {
  /**
   * Batch fetch AI QA analysis for the given external interaction ids.
   * `accountId` comes from `SupervisorRESTManagerService.readContactCenterSettings`.
   */
  getInteractionAnalysis(args: {
    accountId: string;
    externalInteractionIds: string[];
  }): Promise<AxiosResponse<QualityAnalysisResponse>> {
    const { accountId, externalInteractionIds } = args;
    return apiClient.get<QualityAnalysisResponse>(
      `${CQA_BASE}/accounts/${accountId}/quality-analysis${buildQuery({
        external_interaction_ids: externalInteractionIds,
      })}`,
    );
  },
};
