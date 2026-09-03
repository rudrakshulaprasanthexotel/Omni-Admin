import type {
  CommonResponseListCustomDataResponseInteractionOutPutBeanCustomCursorMetadata,
  CustomCursorMetadata,
  InteractionOutPutBean,
} from '@/boilerplate/dataEngineApis/models';
import type { CampaignUserResponse, QueueDetailBean } from '@/boilerplate/cmsApis/models';
import { GetInteractionWithFilterStateEnum } from '@/boilerplate/dataEngineApis/apis/interactions-api';
import { cmsApis } from '@/services/apiClient/cmsApis';
import { dataEngineApis } from '@/services/apiClient/dataEngineApis';
import { supervisorApis, type DispositionCodeBean } from '@/services/apiClient/supervisorApis';

/**
 * All filters and pagination inputs the Interaction Details page can pass to
 * the cross-channel `GET /v1/cc-list/{ccId}/process-list/{processId}/interactions`
 * endpoint (§4 row #16 of the validation report). Everything except the
 * `campaignId` + `dateRange` bracket is optional.
 */
export interface InteractionsFilters {
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

export interface InteractionsPage {
  rows: InteractionOutPutBean[];
  beforeCursor: string | null;
  afterCursor: string | null;
  /** Rows returned in this page, from `metadata.count`. */
  count: number;
  /**
   * `metadata.total_string` parsed into an integer where possible. `-1` means
   * "unknown" (the endpoint may answer `"many"` or `"1000+"`) and the pager
   * then renders without a total badge — a delta on §4 row #16.
   */
  totalRows: number;
  totalString: string | null;
}

export const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_SORT_BY = 'date_added:desc';
const DEFAULT_FIELDS: string[] = ['channel_data', 'additional_info'];
const CAMPAIGN_USERS_LIMIT = 1000;

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
  return `gte:${Math.floor(fromMs / 1000)};lte:${Math.floor(toMs / 1000)}`;
}

/**
 * The next/prev page URLs on `CustomCursorMetadata` embed the raw cursor as a
 * query parameter — we don't consume the URL directly (we go through the
 * generated axios client), so extract the cursor value here.
 */
export function extractCursorFromUrl(
  url: string | undefined,
  paramName: 'before_cursor' | 'after_cursor',
): string | null {
  if (!url) return null;
  try {
    // Cursor URLs can be relative or absolute; URL requires a base for the
    // former.
    const parsed = url.startsWith('http') ? new URL(url) : new URL(url, 'http://x');
    return parsed.searchParams.get(paramName);
  } catch {
    return null;
  }
}

function parseTotal(totalString: string | undefined | null): number {
  if (!totalString) return -1;
  const trimmed = totalString.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'many') return -1;
  // Strip trailing `+` (e.g. "1000+") and any leading "more than " prose.
  const numericPart = trimmed.replace(/^more than\s*/i, '').replace(/\+$/, '');
  const parsed = Number(numericPart);
  return Number.isFinite(parsed) ? parsed : -1;
}

function toInteractionsPage(
  rows: InteractionOutPutBean[],
  metadata: CustomCursorMetadata | null,
): InteractionsPage {
  return {
    rows,
    beforeCursor: extractCursorFromUrl(metadata?.prev_page_url, 'before_cursor'),
    afterCursor: extractCursorFromUrl(metadata?.next_page_url, 'after_cursor'),
    count: metadata?.count ?? rows.length,
    totalRows: parseTotal(metadata?.total_string),
    totalString: metadata?.total_string ?? null,
  };
}

export async function fetchInteractions(
  filters: InteractionsFilters,
  signal?: AbortSignal,
): Promise<InteractionsPage> {
  const response = await dataEngineApis.interactions.getInteractionWithFilter(
    filters.ccId,
    filters.processId,
    buildDateRange(filters.fromEpochMs, filters.toEpochMs),
    filters.state ?? GetInteractionWithFilterStateEnum.Closed,
    filters.campaignIds.length > 0 ? filters.campaignIds : undefined,
    filters.queueIds,
    filters.dispositions,
    filters.channelTypes,
    filters.directions,
    filters.userIds,
    filters.interactionMediaId,
    filters.customerName,
    filters.customerPhone,
    filters.customerId,
    DEFAULT_FIELDS,
    filters.beforeCursor,
    filters.afterCursor,
    filters.sortBy ?? DEFAULT_SORT_BY,
    filters.limit ?? DEFAULT_PAGE_SIZE,
    undefined, // interactionIds
    filters.metadataFilters,
    filters.scopeId,
    filters.universalCustomerId,
    { signal },
  );

  const envelope =
    response.data as CommonResponseListCustomDataResponseInteractionOutPutBeanCustomCursorMetadata;
  const rows = (envelope.response ?? [])
    .map((entry) => entry.data)
    .filter((data): data is InteractionOutPutBean => data != null);

  return toInteractionsPage(rows, envelope.metadata ?? null);
}

export async function fetchCampaignQueues(campaignId: number): Promise<QueueDetailBean[]> {
  const { data } = await cmsApis.campaign.getAllAgentQueueDetailedByCampaign(campaignId);
  return data;
}

export async function fetchCampaignDispositions(
  campaignId: number,
): Promise<DispositionCodeBean[]> {
  const { data } = await supervisorApis.getDispositionCodesByCampaign(campaignId);
  return data;
}

export async function fetchCampaignUsers(args: {
  contactCenterId: number;
  processId: number;
  campaignId: number;
}): Promise<CampaignUserResponse[]> {
  const { data } = await cmsApis.campaign.getAllCampaignUsersInCampaign1(
    args.contactCenterId,
    args.processId,
    args.campaignId,
    CAMPAIGN_USERS_LIMIT,
  );

  // The wire format nests each user under `data`, but the generated model
  // declares a flat `CampaignUserResponse[]` — same swagger drift documented
  // in `utils/mapInteraction.ts`.
  const entries = (data.response ?? []) as Array<{ data?: CampaignUserResponse }>;
  return entries
    .map((entry) => entry?.data)
    .filter((user): user is CampaignUserResponse => user != null);
}

/**
 * Number of QA parameters on the campaign — the `/45` denominator behind each
 * row's score chip, until the single-shot `/interactions/{id}/score-summary`
 * endpoint (§4 row #18) ships.
 */
export async function fetchCampaignQaDenominator(args: {
  campaignId: number;
  contactCenterId: number;
  processId: number;
}): Promise<number> {
  const { data } = await dataEngineApis.callQaParameter.getAllCampaignQAParameterForCampaign(
    args.campaignId,
    args.contactCenterId,
    args.processId,
  );
  return data.response?.data?.length ?? 0;
}
