export type ChatTranscriptSpeaker = 'customer' | 'agent';

export interface ChatTranscriptMessage {
  id: string;
  speaker: ChatTranscriptSpeaker;
  name?: string;
  text: string;
  timestamp?: string;
}

interface MapChatTranscriptContext {
  customerName?: string;
  userName?: string;
}

const CUSTOMER_SPEAKERS = new Set([
  'customer',
  'client',
  'visitor',
  'inbound',
  'from_customer',
  'enduser',
  'end_user',
  'cust',
  'consumer',
]);

const AGENT_SPEAKERS = new Set([
  'agent',
  'user',
  'user_agent',
  'operator',
  'bot',
  'system',
  'outbound',
  'from_agent',
  'you',
  'advisor',
  'supervisor',
]);

const COLLECTION_KEYS = [
  'messages',
  'transcript',
  'chatTranscript',
  'chat_transcript',
  'chatLogs',
  'chat_logs',
  'chatData',
  'chat_data',
  'chats',
  'items',
  'entries',
  'conversation',
  'utterances',
  'response',
  'data',
] as const;

const TEXT_KEYS = [
  'text',
  'message',
  'body',
  'content',
  'msg',
  'chatMessage',
  'chat_message',
  'messageText',
  'message_text',
] as const;

const SPEAKER_KEYS = [
  'speaker',
  'sender',
  'from',
  'role',
  'senderType',
  'sender_type',
  'userType',
  'user_type',
  'authorType',
  'author_type',
  'direction',
  'origin',
  'participantType',
  'participant_type',
  'fromType',
  'from_type',
  'messageFrom',
  'message_from',
] as const;

const NAME_KEYS = [
  'name',
  'senderName',
  'sender_name',
  'displayName',
  'display_name',
  'author',
  'userName',
  'user_name',
  'customerName',
  'customer_name',
  'agentName',
  'agent_name',
] as const;

const TIMESTAMP_KEYS = [
  'timestamp',
  'time',
  'sentAt',
  'sent_at',
  'createdAt',
  'created_at',
  'dateAdded',
  'date_added',
  'messageTime',
  'message_time',
  'ts',
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return String(value);
  return undefined;
}

function pickString(record: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return undefined;
}

function pickNestedText(value: unknown): string | undefined {
  const direct = asString(value);
  if (direct) return direct;

  const record = asRecord(value);
  if (!record) return undefined;

  return (
    pickString(record, TEXT_KEYS) ??
    pickNestedText(record.text) ??
    pickNestedText(record.body) ??
    pickNestedText(record.message)
  );
}

function namesMatch(left?: string, right?: string): boolean {
  if (!left || !right) return false;
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function resolveSpeaker(
  raw: string | undefined,
  name: string | undefined,
  index: number,
  ctx?: MapChatTranscriptContext,
): ChatTranscriptSpeaker {
  if (raw) {
    const normalised = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (CUSTOMER_SPEAKERS.has(normalised)) return 'customer';
    if (AGENT_SPEAKERS.has(normalised)) return 'agent';
    if (normalised.includes('customer') || normalised.includes('client')) return 'customer';
    if (
      normalised.includes('agent') ||
      normalised.includes('bot') ||
      normalised.includes('system')
    ) {
      return 'agent';
    }
  }

  if (namesMatch(name, ctx?.customerName)) return 'customer';
  if (namesMatch(name, ctx?.userName)) return 'agent';
  return index % 2 === 0 ? 'customer' : 'agent';
}

function speakerFromFlags(record: Record<string, unknown>): ChatTranscriptSpeaker | undefined {
  const flags: Array<[unknown, ChatTranscriptSpeaker]> = [
    [record.fromCustomer ?? record.from_customer, 'customer'],
    [record.isCustomer ?? record.is_customer, 'customer'],
    [record.fromAgent ?? record.from_agent, 'agent'],
    [record.isAgent ?? record.is_agent, 'agent'],
  ];

  for (const [value, speaker] of flags) {
    if (value === true) return speaker;
    if (value === false) return speaker === 'customer' ? 'agent' : 'customer';
  }
  return undefined;
}

function unwrapCollection(value: unknown, depth = 0): unknown[] {
  if (depth > 5) return [];
  if (Array.isArray(value)) return value;

  const record = asRecord(value);
  if (!record) return [];

  for (const key of COLLECTION_KEYS) {
    if (record[key] == null) continue;
    const found = unwrapCollection(record[key], depth + 1);
    if (found.length > 0 || Array.isArray(record[key])) return found;
  }

  if (pickNestedText(record) || pickString(record, SPEAKER_KEYS) || pickString(record, TIMESTAMP_KEYS)) {
    return [record];
  }

  return [];
}

function mapMessage(
  raw: unknown,
  index: number,
  ctx?: MapChatTranscriptContext,
): ChatTranscriptMessage | null {
  if (typeof raw === 'string' && raw.trim() !== '') {
    return {
      id: `msg-${index}`,
      speaker: resolveSpeaker(undefined, undefined, index, ctx),
      text: raw.trim(),
    };
  }

  const record = asRecord(raw);
  if (!record) return null;

  const text = pickNestedText(record);
  if (!text) return null;

  const name = pickString(record, NAME_KEYS);
  const speaker =
    speakerFromFlags(record) ??
    resolveSpeaker(pickString(record, SPEAKER_KEYS), name, index, ctx);

  return {
    id: pickString(record, ['id', 'messageId', 'message_id']) ?? `msg-${index}`,
    speaker,
    name,
    text,
    timestamp: pickString(record, TIMESTAMP_KEYS),
  };
}

function parsePlainTranscript(text: string, ctx?: MapChatTranscriptContext): ChatTranscriptMessage[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line, index) => {
      const match = line.match(/^(customer|client|agent|bot|you|user|system)\s*[:\-]\s*(.+)$/i);
      if (!match) return mapMessage(line, index, ctx);
      return {
        id: `msg-${index}`,
        speaker: resolveSpeaker(match[1], undefined, index, ctx),
        text: match[2].trim(),
      } satisfies ChatTranscriptMessage;
    })
    .filter((message): message is ChatTranscriptMessage => message != null);
}

export function mapChatTranscript(
  payload: unknown,
  ctx?: MapChatTranscriptContext,
): ChatTranscriptMessage[] {
  let value = payload;

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (trimmed === '') return [];
    try {
      value = JSON.parse(trimmed) as unknown;
    } catch {
      return parsePlainTranscript(trimmed, ctx);
    }
  }

  return unwrapCollection(value)
    .map((entry, index) => mapMessage(entry, index, ctx))
    .filter((message): message is ChatTranscriptMessage => message != null);
}
