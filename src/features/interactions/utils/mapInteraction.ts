import type {
  ChannelDataBean,
  InteractionOutPutBean,
} from '@/boilerplate/dataEngineApis/models';
import {
  InteractionChannel,
  InteractionChannelType,
  type Interaction,
  type InteractionState,
} from '../types';
import { humanizeKey } from './formatInteraction';

/**
 * The generated boilerplate declares `InteractionOutPutBean` / `ChannelDataBean`
 * with camelCase keys, but the underlying Java beans are annotated with
 * `@JsonNaming(SnakeCaseStrategy)` — meaning the wire format can be snake_case.
 * The mismatch is documented in §9 of `InteractionDetails_Figma_vs_GWT_Validation.md`.
 * Until the swagger is regenerated we accept both shapes at runtime via
 * `pickField` and let the compile-time type stay camelCase.
 */
type Loose<T> = T & Record<string, unknown>;

function pickField<TValue>(
  bean: Record<string, unknown>,
  ...keys: string[]
): TValue | undefined {
  for (const key of keys) {
    const value = bean[key];
    if (value !== undefined && value !== null && value !== '') {
      return value as TValue;
    }
  }
  return undefined;
}

function pickString(bean: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = bean[key];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
  }
  return undefined;
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Maps the `channel_name` values emitted by `reports-and-stats`
 * (`voice`, `whatsapp`, `mail`, `chat`, `sms`) to the presentation-level
 * `InteractionChannel` enum. Unknown values fall back to `CALL` (voice) so the
 * grid never renders a blank icon.
 */
const CHANNEL_NAME_TO_CHANNEL: Record<string, InteractionChannel> = {
  voice: InteractionChannel.CALL,
  call: InteractionChannel.CALL,
  phone: InteractionChannel.CALL,
  whatsapp: InteractionChannel.WHATSAPP,
  sms: InteractionChannel.SMS,
  mail: InteractionChannel.MAIL,
  email: InteractionChannel.MAIL,
  chat: InteractionChannel.CHAT,
};

/**
 * `direction` / `sub_channel` → `InteractionChannelType`. The backend emits
 * lowercase machine strings (`inbound`, `outbound_manual`, `outbound_auto`,
 * `outbound_multi`, etc.) — same convention as GWT's `CallDetailsConstants`
 * but without the dot-separated dial-mode prefixes.
 */
const DIRECTION_TO_CHANNEL_TYPE: Record<string, InteractionChannelType> = {
  inbound: InteractionChannelType.INBOUND,
  outbound: InteractionChannelType.OUTBOUND_MANUAL,
  outbound_manual: InteractionChannelType.OUTBOUND_MANUAL,
  outbound_auto: InteractionChannelType.OUTBOUND_AUTO_DIAL,
  outbound_multi: InteractionChannelType.OUTBOUND_MULTI_DIAL,
  outbound_preview: InteractionChannelType.OUTBOUND_MANUAL,
  outbound_progressive: InteractionChannelType.OUTBOUND_AUTO_DIAL,
  outbound_predictive: InteractionChannelType.OUTBOUND_AUTO_DIAL,
  callback: InteractionChannelType.OUTBOUND_MANUAL,
  transfer: InteractionChannelType.INBOUND,
};

const resolveChannel = (channelName?: string): InteractionChannel => {
  if (!channelName) return InteractionChannel.CALL;
  return CHANNEL_NAME_TO_CHANNEL[channelName.toLowerCase()] ?? InteractionChannel.CALL;
};

const resolveChannelType = (direction?: string): InteractionChannelType => {
  if (!direction) return InteractionChannelType.INBOUND;
  return DIRECTION_TO_CHANNEL_TYPE[direction.toLowerCase()] ?? InteractionChannelType.INBOUND;
};

const resolveInteractionState = (status?: string): InteractionState | undefined => {
  if (!status) return undefined;
  const normalised = status.trim().toLowerCase();
  if (normalised === 'closed') return 'CLOSED';
  if (normalised === 'open') return 'OPEN';
  return undefined;
};

const CONSUMED_KEYS = new Set([
  'id',
  'title',
  'customerId',
  'customer_id',
  'customerName',
  'customer_name',
  'lastAssignedUserId',
  'last_assigned_user_id',
  'lastAssignedUserName',
  'last_assigned_user_name',
  'lastCampaignName',
  'last_campaign_name',
  'lastQueueName',
  'last_queue_name',
  'lastDisposition',
  'last_disposition',
  'channelName',
  'channel_name',
  'subChannel',
  'sub_channel',
  'direction',
  'dateAdded',
  'date_added',
  'dateModified',
  'date_modified',
  'dateDisposed',
  'date_disposed',
  'interactionRelationId',
  'interaction_relation_id',
  'status',
  'firstAssignedDate',
  'first_assigned_date',
  'assignedDate',
  'assigned_date',
  'channelData',
  'channel_data',
  'additionalInfo',
  'additional_info',
  'customerContact',
  'customer_contact',
  'mediaId',
  'media_id',
  'duration',
  'lastDid',
  'last_did',
  'did',
  'voiceLogUrl',
  'voice_log_url',
  'chatTranscriptUrl',
  'chat_transcript_url',
  'case_id',
  'caseId',
  'caseID',
  'caseid',
  'last_disposition_class',
  'lastDispositionClass',
  'last_disposition_name',
  'lastDispositionName',
  'interactionMediaId',
  'interaction_media_id',
]);

function formatPresentValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim();
    return text !== '' && text !== '—' ? text : undefined;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    if (value.every((item) => typeof item === 'string' || typeof item === 'number')) {
      return value.join(', ');
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return keys.length > 0 ? JSON.stringify(value) : undefined;
  }
  return undefined;
}

function collectExtraFields(
  ...sources: Array<Record<string, unknown>>
): Array<{ key: string; label: string; value: string }> {
  const extras: Array<{ key: string; label: string; value: string }> = [];
  const seen = new Set<string>();

  for (const source of sources) {
    for (const [key, raw] of Object.entries(source)) {
      if (CONSUMED_KEYS.has(key) || seen.has(key)) continue;
      const value = formatPresentValue(raw);
      if (value == null) continue;
      seen.add(key);
      extras.push({ key, label: humanizeKey(key), value });
    }
  }

  return extras;
}

const durationToSeconds = (duration: unknown): number => {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return Math.max(0, Math.trunc(duration));
  }
  if (typeof duration === 'string' && duration.trim() !== '') {
    const parsed = Number(duration);
    if (!Number.isNaN(parsed)) return Math.max(0, Math.trunc(parsed));
  }
  return 0;
};

export interface MapInteractionContext {
  /**
   * QA denominator (`/45`) resolved once per campaign; `null` = not loaded.
   * Still needed as long as the single-shot `/interactions/{id}/score-summary`
   * endpoint (§4 row #18) is not shipped.
   */
  qaDenominator?: number | null;
  /** `interactionId -> score` numerator map. Empty until per-row scoring ships. */
  qaScoreByInteractionId?: Record<string, number | null>;
}

export function mapInteractionOutPutBeanToInteraction(
  raw: InteractionOutPutBean,
  ctx: MapInteractionContext = {},
): Interaction {
  const bean = raw as Loose<InteractionOutPutBean>;
  const channelData = asObject(
    pickField<ChannelDataBean | Record<string, unknown> | string>(
      bean,
      'channelData',
      'channel_data',
    ),
  ) as Loose<ChannelDataBean>;
  const additionalInfo = asObject(
    pickField<Record<string, unknown> | string>(bean, 'additionalInfo', 'additional_info'),
  );

  const id = pickString(bean, 'id') ?? '';
  const customerName = pickString(bean, 'customerName', 'customer_name') ?? '—';
  const userName =
    pickString(bean, 'lastAssignedUserName', 'last_assigned_user_name') ?? '—';
  const campaignName = pickString(bean, 'lastCampaignName', 'last_campaign_name') ?? '';
  const queueName = pickString(bean, 'lastQueueName', 'last_queue_name') ?? '';
  const channelName = pickString(bean, 'channelName', 'channel_name');
  const direction =
    pickString(bean, 'direction') ?? pickString(bean, 'subChannel', 'sub_channel');
  const dateAdded = pickString(bean, 'dateAdded', 'date_added') ?? '';
  const startDate =
    pickString(bean, 'firstAssignedDate', 'first_assigned_date', 'assignedDate', 'assigned_date') ??
    dateAdded;
  const endDate =
    pickString(bean, 'dateDisposed', 'date_disposed', 'dateModified', 'date_modified') ?? '';
  const did =
    pickString(channelData, 'lastDid', 'last_did', 'did') ??
    pickString(additionalInfo, 'last_did', 'lastDid', 'did') ??
    '';
  const caseId =
    pickString(additionalInfo, 'case_id', 'caseId', 'caseID', 'caseid') ?? '';
  const dispositionCode =
    pickString(bean, 'lastDisposition', 'last_disposition') ?? '';
  const dispositionClass =
    pickString(additionalInfo, 'last_disposition_class', 'lastDispositionClass') ?? '';
  const systemDisposition =
    pickString(additionalInfo, 'last_disposition_name', 'lastDispositionName') ??
    dispositionCode;
  const uniqueId =
    pickString(bean, 'interactionRelationId', 'interaction_relation_id') ?? id;
  const status = pickString(bean, 'status');

  const customerContact =
    pickString(channelData, 'customerContact', 'customer_contact') ??
    pickString(channelData, 'mediaId', 'media_id') ??
    pickString(bean, 'interactionMediaId', 'interaction_media_id') ??
    '';
  const voiceLogUrl = pickString(channelData, 'voiceLogUrl', 'voice_log_url');
  const chatTranscriptUrl = pickString(
    channelData,
    'chatTranscriptUrl',
    'chat_transcript_url',
  );
  const interactionSeconds = durationToSeconds(pickField(channelData, 'duration'));

  const numerator =
    id in (ctx.qaScoreByInteractionId ?? {})
      ? ctx.qaScoreByInteractionId?.[id] ?? null
      : null;
  const scoring =
    ctx.qaDenominator != null && numerator != null
      ? { score: numerator, total: ctx.qaDenominator }
      : null;

  return {
    id,
    customer: { name: customerName },
    channelDetail: customerContact,
    channel: resolveChannel(channelName),
    channelType: resolveChannelType(direction),
    user: { name: userName },
    scoring,
    campaign: campaignName,
    queue: queueName,
    dateAdded,
    did,
    caseId,
    startDate,
    endDate,
    interactionTimeSeconds: interactionSeconds,
    // Voice per-row timers not yet exposed by the endpoint — see §4 row #16
    // delta ("voice-specific per-row timers on channel_data").
    holdTimeSeconds: 0,
    ivrTimeSeconds: 0,
    setupTimeSeconds: 0,
    ringingTimeSeconds: 0,
    systemDisposition,
    dispositionClass,
    dispositionCode,
    uniqueId,
    voiceLogUrl,
    chatTranscriptUrl,
    interactionState: resolveInteractionState(status),
    extraFields: collectExtraFields(bean, channelData, additionalInfo),
  };
}
