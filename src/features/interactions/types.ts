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
  /** All time metrics are stored as total seconds and formatted at render-time. */
  interactionTimeSeconds: number;
  holdTimeSeconds: number;
  ivrTimeSeconds: number;
  setupTimeSeconds: number;
  ringingTimeSeconds: number;
  systemDisposition: string;
  dispositionClass: string;
  dispositionCode: string;
  /** Display-only unique interaction id shown in the last column. Falls back to `id`. */
  uniqueId?: string;
}
