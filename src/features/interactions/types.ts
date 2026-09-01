export const InteractionChannel = {
  CALL: 'Call',
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  MAIL: 'Mail',
  CHAT: 'Chat',
} as const;

export type InteractionChannel = (typeof InteractionChannel)[keyof typeof InteractionChannel];

export const InteractionChannelType = {
  INBOUND: 'Inbound',
  OUTBOUND_MANUAL: 'Outbound (Manual)',
  OUTBOUND_MULTI_DIAL: 'Outbound (Multi-Dial)',
  OUTBOUND_AUTO_DIAL: 'Outbound (Auto-Dial)',
} as const;

export type InteractionChannelType =
  (typeof InteractionChannelType)[keyof typeof InteractionChannelType];

/**
 * Historical vs live view. The Interaction Details page defaults to `CLOSED`
 * (audit list). `OPEN` maps to the same endpoint with `state=OPEN` and is
 * reserved for a future live-monitoring toggle.
 */
export type InteractionState = 'OPEN' | 'CLOSED';

export interface Interaction {
  id: string;
  customer: {
    name: string;
    avatarUrl?: string;
  };
  /** Raw channel handle (phone / email). May be masked at render-time per RBAC. */
  channelDetail: string;
  channel: InteractionChannel;
  channelType: InteractionChannelType;
  user: {
    name: string;
    avatarUrl?: string;
  };
  /** QA score displayed as "score/total" — total defaults to 45 to match Figma. */
  scoring: {
    score: number;
    total: number;
  } | null;
  campaign: string;
  queue: string;
  /** ISO 8601 timestamp for the "Date Added" column. */
  dateAdded: string;
  /** Voice DID from `channel_data.last_did`. */
  did?: string;
  /** Optional CRM case id when present on `additional_info`. */
  caseId?: string;
  /** Session start — `date_added` / `first_assigned_date`. */
  startDate?: string;
  /** Session end — `date_disposed` / `date_modified`. */
  endDate?: string;
  /**
   * Aggregate interaction duration in seconds (voice + digital). Sourced from
   * `channel_data.duration` on the cross-channel bean.
   */
  interactionTimeSeconds: number;
  /**
   * Voice per-row timers. Not populated by the current backend — these are a
   * delta on §4 row #16 of `InteractionDetails_Figma_vs_GWT_Validation.md`.
   * Default to `0` (not `undefined`) so the "hh:mm:ss" formatter renders `00:00:00`.
   */
  holdTimeSeconds: number;
  ivrTimeSeconds: number;
  setupTimeSeconds: number;
  ringingTimeSeconds: number;
  systemDisposition: string;
  dispositionClass: string;
  dispositionCode: string;
  /** Display-only unique interaction id shown in the last column. Falls back to `id`. */
  uniqueId?: string;
  contactCenterId?: number;
  processId?: number;
  /**
   * Row Play sources. Voice + chat come from the row bean; mail body /
   * attachments still wait on §4 row #17 (`/interactions/{id}/attachments`).
   */
  voiceLogUrl?: string;
  chatTranscriptUrl?: string;
  interactionState?: InteractionState;
  /** Remaining present scalars from the row / channel_data / additional_info. */
  extraFields: Array<{ key: string; label: string; value: string }>;
}
