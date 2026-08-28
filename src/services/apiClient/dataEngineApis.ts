import { CallHistoryApi } from '@/boilerplate/dataEngineApis/apis/call-history-api';
import { CallQAParameterApi } from '@/boilerplate/dataEngineApis/apis/call-qaparameter-api';
import { CallQAScoreApi } from '@/boilerplate/dataEngineApis/apis/call-qascore-api';
import { InteractionQAScoreApi } from '@/boilerplate/dataEngineApis/apis/interaction-qascore-api';
import { InteractionsApi } from '@/boilerplate/dataEngineApis/apis/interactions-api';
import { VoiceLogsApi } from '@/boilerplate/dataEngineApis/apis/voice-logs-api';
import { Configuration as DataEngineConfiguration } from '@/boilerplate/dataEngineApis/configuration';
import { apiClient } from '.';

export const dataEngineConfiguration = new DataEngineConfiguration({
  basePath: import.meta.env.VITE_DATA_ENGINE_API_BASE_PATH,
});

/**
 * Data Engine REST client. All endpoints reused by the Interaction Details
 * page — row load (§4 row #16 → `interactions`), QA score, campaign QA
 * denominator, voice-log playback — are exposed here. New endpoints go here,
 * not into feature-level thunks, so the axios instance + auth interceptors
 * from `.` are shared across the app.
 *
 * Note: `CallDetailsApi` (voice-only `POST /voice/callHistoryWithScoring/search`)
 * was retired when the row-load switched to the cross-channel
 * `GET /v1/cc-list/{ccId}/process-list/{processId}/interactions` endpoint.
 */
export const dataEngineApis = {
  callHistory: new CallHistoryApi(dataEngineConfiguration, undefined, apiClient),
  callQaParameter: new CallQAParameterApi(dataEngineConfiguration, undefined, apiClient),
  callQaScore: new CallQAScoreApi(dataEngineConfiguration, undefined, apiClient),
  interactions: new InteractionsApi(dataEngineConfiguration, undefined, apiClient),
  interactionQaScore: new InteractionQAScoreApi(dataEngineConfiguration, undefined, apiClient),
  voiceLogs: new VoiceLogsApi(dataEngineConfiguration, undefined, apiClient),
} as const;
