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
  const channelDataRaw = pickField<ChannelDataBean | Record<string, unknown>>(
    bean,
    'channelData',
    'channel_data',
  );
  const channelData = (channelDataRaw ?? {}) as Loose<ChannelDataBean>;
  const additionalInfo = (pickField<Record<string, unknown>>(
    bean,
    'additionalInfo',
    'additional_info',
  ) ?? {}) as Record<string, unknown>;

  const id = pickField<string>(bean, 'id') ?? '';
  const customerName = pickField<string>(bean, 'customerName', 'customer_name') ?? '—';
  const userName =
    pickField<string>(bean, 'lastAssignedUserName', 'last_assigned_user_name') ?? '—';
  const campaignName =
    pickField<string>(bean, 'lastCampaignName', 'last_campaign_name') ?? '';
  const queueName = pickField<string>(bean, 'lastQueueName', 'last_queue_name') ?? '';
  const channelName = pickField<string>(bean, 'channelName', 'channel_name');
  const direction =
    pickField<string>(bean, 'direction') ??
    pickField<string>(bean, 'subChannel', 'sub_channel');
  const dateAdded = pickField<string>(bean, 'dateAdded', 'date_added') ?? '';
  const dispositionCode =
    pickField<string>(bean, 'lastDisposition', 'last_disposition') ?? '';
  const dispositionClass =
    pickField<string>(additionalInfo, 'last_disposition_class', 'lastDispositionClass') ??
    '';
  const systemDisposition =
    pickField<string>(additionalInfo, 'last_disposition_name', 'lastDispositionName') ??
    dispositionCode;
  const uniqueId =
    pickField<string>(bean, 'interactionRelationId', 'interaction_relation_id') ?? id;
  const status = pickField<string>(bean, 'status');

  const customerContact =
    pickField<string>(channelData, 'customerContact', 'customer_contact') ??
    pickField<string>(channelData, 'mediaId', 'media_id') ??
    '';
  const voiceLogUrl = pickField<string>(channelData, 'voiceLogUrl', 'voice_log_url');
  const chatTranscriptUrl = pickField<string>(
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
  };
}
