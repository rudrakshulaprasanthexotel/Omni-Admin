import type { CallDetailsBean } from '@/boilerplate/dataEngineApis/models';
import {
  InteractionChannel,
  InteractionChannelType,
  type Interaction,
} from '../types';

/**
 * `CallDetailsBean.callType` is the raw dial-mode string from the historical
 * voice endpoint. Keep the mapping here so the presentation layer never has
 * to know about the backend vocabulary.
 */
const CALL_TYPE_TO_CHANNEL_TYPE: Record<string, InteractionChannelType> = {
  'inbound.call.dial': InteractionChannelType.INBOUND,
  'inbound.call': InteractionChannelType.INBOUND,
  inbound: InteractionChannelType.INBOUND,
  'outbound.manual.dial': InteractionChannelType.OUTBOUND_MANUAL,
  'outbound.manual': InteractionChannelType.OUTBOUND_MANUAL,
  'outbound.auto.dial': InteractionChannelType.OUTBOUND_AUTO_DIAL,
  'outbound.auto': InteractionChannelType.OUTBOUND_AUTO_DIAL,
  'outbound.preview.dial': InteractionChannelType.OUTBOUND_MANUAL,
  'outbound.progressive.dial': InteractionChannelType.OUTBOUND_AUTO_DIAL,
  'outbound.predictive.dial': InteractionChannelType.OUTBOUND_AUTO_DIAL,
  'outbound.multi.dial': InteractionChannelType.OUTBOUND_MULTI_DIAL,
  'transfer.call': InteractionChannelType.INBOUND,
  'callback.call': InteractionChannelType.OUTBOUND_MANUAL,
};

const parseSeconds = (raw: string | number | undefined | null): number => {
  if (raw === undefined || raw === null || raw === '') return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.max(0, Math.trunc(raw)) : 0;

  const trimmed = String(raw).trim();
  if (!trimmed) return 0;

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => Number(p) || 0);
    // Accept hh:mm:ss or mm:ss.
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }

  const asNumber = Number(trimmed);
  if (Number.isNaN(asNumber)) return 0;

  // The voice endpoint returns ms for callResult durations in some builds and
  // seconds in others. Anything > 24h treated as ms.
  return asNumber > 86_400 ? Math.trunc(asNumber / 1000) : Math.trunc(asNumber);
};

const combineDateAdded = (dateAdded?: string, timeAdded?: string): string => {
  if (!dateAdded) return '';
  if (!timeAdded) return dateAdded;
  return `${dateAdded}T${timeAdded}`;
};

export interface MapCallDetailsContext {
  /** `campaignId -> campaignName` join (loaded once via `supervisorApis.getAssignedCampaigns`). */
  campaignNameById?: Record<string | number, string>;
  /** `customerId -> customerName` join. Empty until the batch resolver ships. */
  customerNameById?: Record<string | number, string>;
  /** QA denominator (`/45`) resolved once per campaign; `null` = not loaded. */
  qaDenominator?: number | null;
  /** `callId -> score` numerator map. Empty until per-row scoring ships. */
  qaScoreByCallId?: Record<string, number | null>;
}

const preferDisplayPhone = (bean: CallDetailsBean): string =>
  bean.displayPhone || bean.maskedPhone || bean.phone || '';

const resolveChannelType = (callType?: string): InteractionChannelType => {
  if (!callType) return InteractionChannelType.INBOUND;
  const key = callType.toLowerCase();
  return CALL_TYPE_TO_CHANNEL_TYPE[key] ?? InteractionChannelType.INBOUND;
};

/**
 * Maps a single `CallDetailsBean` row (voice-only) to the presentation-level
 * `Interaction` shape. Digital-channel awareness lives in the omni mapper —
 * this one always tags rows as `InteractionChannel.CALL`.
 */
export function mapCallDetailsToInteraction(
  bean: CallDetailsBean,
  ctx: MapCallDetailsContext = {},
): Interaction {
  const { campaignNameById = {}, customerNameById = {}, qaDenominator, qaScoreByCallId = {} } = ctx;

  const callId = bean.callId ?? bean.interactionId ?? '';
  const campaignKey = bean.campaignId ?? '';
  const campaignName = campaignKey && campaignNameById[campaignKey]
    ? campaignNameById[campaignKey]
    : campaignKey
      ? String(campaignKey)
      : '';

  const customerKey = bean.customerId ?? '';
  const customerName = customerKey && customerNameById[customerKey]
    ? customerNameById[customerKey]
    : bean.leadId
      ? `Lead ${bean.leadId}`
      : customerKey
        ? `Customer ${customerKey}`
        : '—';

  const score = callId in qaScoreByCallId ? qaScoreByCallId[callId] : null;
  const scoring = bean.callScored && qaDenominator != null && score != null
    ? { score, total: qaDenominator }
    : bean.callScored && qaDenominator != null
      ? { score: 0, total: qaDenominator }
      : null;

  return {
    id: callId || (bean.interactionId ?? ''),
    customer: { name: customerName },
    channelDetail: preferDisplayPhone(bean),
    channel: InteractionChannel.CALL,
    channelType: resolveChannelType(bean.callType),
    user: { name: bean.userName ?? bean.userId ?? '—' },
    scoring,
    campaign: campaignName,
    queue: bean.queueName ?? '',
    dateAdded: combineDateAdded(bean.dateAdded, bean.timeAdded),
    interactionTimeSeconds: parseSeconds(bean.talkTime),
    holdTimeSeconds: parseSeconds(bean.holdTime),
    ivrTimeSeconds: parseSeconds(bean.ivrTime),
    setupTimeSeconds: parseSeconds(bean.setupTime),
    ringingTimeSeconds: parseSeconds(bean.ringingTime),
    systemDisposition: bean.systemDisposition ?? '',
    dispositionClass: bean.dispositionClass ?? '',
    dispositionCode: bean.dispositionCode ?? '',
    uniqueId: bean.uniqueIdentifier ?? bean.interactionId ?? undefined,
  };
}
