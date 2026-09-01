import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import type {
  CommonResponseListCustomDataResponseInteractionOutPutBeanCustomCursorMetadata,
  CustomCursorMetadata,
  InteractionOutPutBean,
} from '@/boilerplate/dataEngineApis/models';
import type { QueueDetailBean } from '@/boilerplate/cmsApis/models';
import { GetInteractionWithFilterStateEnum } from '@/boilerplate/dataEngineApis/apis/interactions-api';
import { cmsApis } from '@/services/apiClient/cmsApis';
import { dataEngineApis } from '@/services/apiClient/dataEngineApis';
import { supervisorApis, type DispositionCodeBean } from '@/services/apiClient/supervisorApis';
import {
  normaliseAxiosResponse,
  type NormalisedAxiosResponse,
} from '@/shared/utils/normaliseAxiosResponse';
import type { RootState } from '@/store';

/**
 * All filters and pagination inputs the Interaction Details page can pass to
 * the cross-channel `GET /v1/cc-list/{ccId}/process-list/{processId}/interactions`
 * endpoint (§4 row #16 of the validation report). Everything except the
 * `campaignId` + `dateRange` bracket is optional.
 */
export interface FetchInteractionsArgs {
  ccId: number;
  processId: number;
  campaignIds: number[];
  fromEpochMs?: number;
  toEpochMs?: number;
  state?: GetInteractionWithFilterStateEnum;
  limit?: number;
  beforeCursor?: string;
  afterCursor?: string;
  sortBy?: string;
  queueIds?: number[];
  userIds?: string[];
  dispositions?: string[];
  channelTypes?: string[];
  directions?: string[];
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  interactionMediaId?: string;
  metadataFilters?: string[];
  scopeId?: string;
  universalCustomerId?: string;
}

export interface FetchInteractionsResult {
  rows: InteractionOutPutBean[];
  metadata: CustomCursorMetadata | null;
}

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_SORT_BY = 'date_added:desc';
const DEFAULT_FIELDS: string[] = ['channel_data', 'additional_info'];

/**
 * The endpoint expects `date_range=gte:<fromEpochSec>;lte:<toEpochSec>` — see
 * the browser trace on `GET /v1/cc-list/{ccId}/process-list/{processId}/interactions`.
 * Both bounds are epoch **seconds** (10-digit), not milliseconds; the caller
 * side keeps ms internally, so we scale down here.
 */
function buildDateRange(fromEpochMs?: number, toEpochMs?: number): string {
  const nowMs = Date.now();
  const fromMs = fromEpochMs ?? nowMs - DEFAULT_LOOKBACK_MS;
  const toMs = toEpochMs ?? nowMs;
  const fromSec = Math.floor(fromMs / 1000);
  const toSec = Math.floor(toMs / 1000);
  return `gte:${fromSec};lte:${toSec}`;
}

/**
 * The next/prev page URLs on `CustomCursorMetadata` embed the raw cursor as a
 * query parameter — we don't consume the URL directly (we go through the
 * generated axios client), so extract the cursor value here.
 */
export function extractCursorFromUrl(
  url: string | undefined,
  paramName: 'before_cursor' | 'after_cursor',
): string | undefined {
  if (!url) return undefined;
  try {
    // Cursor URLs can be relative or absolute; URL requires a base for the
    // former.
    const parsed = url.startsWith('http')
      ? new URL(url)
      : new URL(url, 'http://x');
    return parsed.searchParams.get(paramName) ?? undefined;
  } catch {
    return undefined;
  }
}

export const fetchInteractions = createAsyncThunk<
  NormalisedAxiosResponse<FetchInteractionsResult>,
  FetchInteractionsArgs,
  { rejectValue: NormalisedAxiosResponse; state: RootState }
>('interactions/fetchInteractions', async (args, { rejectWithValue }) => {
  const dateRange = buildDateRange(args.fromEpochMs, args.toEpochMs);
  const state = args.state ?? GetInteractionWithFilterStateEnum.Closed;
  const limit = args.limit ?? DEFAULT_PAGE_SIZE;
  const sortBy = args.sortBy ?? DEFAULT_SORT_BY;

  try {
    const response = await dataEngineApis.interactions.getInteractionWithFilter(
      args.ccId,
      args.processId,
      dateRange,
      state,
      args.campaignIds.length > 0 ? args.campaignIds : undefined,
      args.queueIds,
      args.dispositions,
      args.channelTypes,
      args.directions,
      args.userIds,
      args.interactionMediaId,
      args.customerName,
      args.customerPhone,
      args.customerId,
      DEFAULT_FIELDS,
      args.beforeCursor,
      args.afterCursor,
      sortBy,
      limit,
      undefined, // interactionIds
      args.metadataFilters,
      args.scopeId,
      args.universalCustomerId,
    );

    const envelope =
      response.data as CommonResponseListCustomDataResponseInteractionOutPutBeanCustomCursorMetadata;
    const rows = (envelope.response ?? [])
      .map((entry) => entry.data)
      .filter((data): data is InteractionOutPutBean => data != null);

    return normaliseAxiosResponse<FetchInteractionsResult>(
      { ...response, data: { rows, metadata: envelope.metadata ?? null } },
      'success',
    );
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return rejectWithValue(normaliseAxiosResponse(error, 'error'));
    }
    return rejectWithValue({
      isSuccess: false,
      message: 'Failed to load interactions',
    });
  }
});

export const fetchCampaignQaDenominator = createAsyncThunk<
  { campaignId: number; total: number },
  { campaignId: number; contactCenterId: number; processId: number },
  { rejectValue: NormalisedAxiosResponse }
>(
  'interactions/fetchCampaignQaDenominator',
  async ({ campaignId, contactCenterId, processId }, { rejectWithValue }) => {
    try {
      const response = await dataEngineApis.callQaParameter.getAllCampaignQAParameterForCampaign(
        campaignId,
        contactCenterId,
        processId,
      );
      const total = response.data.response?.data?.length ?? 0;
      return { campaignId, total };
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: 'Failed to load QA parameters',
      });
    }
  },
);

export const fetchCampaignQueues = createAsyncThunk<
  NormalisedAxiosResponse<QueueDetailBean[]>,
  number,
  { rejectValue: NormalisedAxiosResponse }
>('interactions/fetchCampaignQueues', async (campaignId, { rejectWithValue }) => {
  try {
    const response = await cmsApis.campaign.getAllAgentQueueDetailedByCampaign(campaignId);
    return normaliseAxiosResponse(response, 'success');
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return rejectWithValue(normaliseAxiosResponse(error, 'error'));
    }
    return rejectWithValue({
      isSuccess: false,
      message: 'Failed to load queues',
    });
  }
});

export const fetchCampaignDispositions = createAsyncThunk<
  NormalisedAxiosResponse<DispositionCodeBean[]>,
  number,
  { rejectValue: NormalisedAxiosResponse }
>('interactions/fetchCampaignDispositions', async (campaignId, { rejectWithValue }) => {
  try {
    const response = await supervisorApis.getDispositionCodesByCampaign(campaignId);
    return normaliseAxiosResponse(response, 'success');
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return rejectWithValue(normaliseAxiosResponse(error, 'error'));
    }
    return rejectWithValue({
      isSuccess: false,
      message: 'Failed to load dispositions',
    });
  }
});

export const fetchAssignedCampaigns = createAsyncThunk<
  NormalisedAxiosResponse<Awaited<ReturnType<typeof supervisorApis.getAssignedCampaigns>>['data']>,
  void,
  { rejectValue: NormalisedAxiosResponse; state: RootState }
>('interactions/fetchAssignedCampaigns', async (_, { getState, rejectWithValue }) => {
  try {
    const sessionId = getState()?.auth?.loginResponse?.userSessionInfo?.sessionId;
    const response = await supervisorApis.getAssignedCampaigns(sessionId);
    return normaliseAxiosResponse(response, 'success');
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return rejectWithValue(normaliseAxiosResponse(error, 'error'));
    }
    return rejectWithValue({
      isSuccess: false,
      message: 'Failed to load campaigns',
    });
  }
});
