import { formatTimelineDate, humanizeKey } from './formatInteraction';

export interface InteractionTimelineEvent {
  id: string;
  eventName: string;
  timestamp: string;
  title: string;
  description: string;
}

const COLLECTION_KEYS = [
  'response',
  'data',
  'events',
  'timeline',
  'activities',
  'items',
  'timelineEvents',
  'timeline_events',
] as const;

const TIMESTAMP_KEYS = [
  'timestamp',
  'eventTime',
  'event_time',
  'createdAt',
  'created_at',
  'createdOn',
  'created_on',
  'createdDate',
  'created_date',
  'date',
  'time',
  'occurredAt',
  'occurred_at',
] as const;

const TITLE_KEYS = [
  'title',
  'eventName',
  'event_name',
  'displayName',
  'display_name',
  'label',
  'eventLabel',
  'event_label',
  'name',
  'activityName',
  'activity_name',
  'eventType',
  'event_type',
  'activityType',
  'activity_type',
  'type',
] as const;

const DESCRIPTION_KEYS = [
  'description',
  'statusText',
  'status_text',
  'message',
  'subtitle',
  'details',
  'status',
  'eventDescription',
  'event_description',
  'activityDescription',
  'activity_description',
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function unwrapCollection(value: unknown, depth = 0): unknown[] {
  if (depth > 5) return [];
  if (Array.isArray(value)) {
    if (
      value.length > 0 &&
      value.every((entry) => {
        const record = asRecord(entry);
        return record != null && record.data != null;
      })
    ) {
      return value.flatMap((entry) => {
        const data = asRecord(entry)?.data;
        if (Array.isArray(data)) return unwrapCollection(data, depth + 1);
        return data == null ? [] : [data];
      });
    }
    return value;
  }

  const record = asRecord(value);
  if (!record) return [];

  for (const key of COLLECTION_KEYS) {
    if (record[key] == null) continue;
    const found = unwrapCollection(record[key], depth + 1);
    if (found.length > 0 || Array.isArray(record[key])) return found;
  }

  if (pickString(record, TITLE_KEYS) || pickString(record, TIMESTAMP_KEYS)) {
    return [record];
  }

  return [];
}

function pickString(record: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
  }
  return undefined;
}

function formatTimestamp(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    return formatTimelineDate(new Date(ms).toISOString());
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return '';
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber) && /^\d+(\.\d+)?$/.test(trimmed)) {
      return formatTimestamp(asNumber);
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return formatTimelineDate(trimmed);
    return trimmed;
  }
  return '';
}

function displayEventLabel(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  const isMachineToken = /^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(trimmed) || trimmed.includes('_');
  return isMachineToken ? humanizeKey(trimmed.toLowerCase()) : trimmed;
}

function mapEvent(raw: unknown, index: number): InteractionTimelineEvent | null {
  const record = asRecord(raw);
  if (!record) return null;

  const titleRaw = pickString(record, TITLE_KEYS);
  const descriptionRaw = pickString(record, DESCRIPTION_KEYS);
  const timestampRaw = pickString(record, TIMESTAMP_KEYS);
  const eventName = (titleRaw ?? '').trim().toUpperCase().replace(/\s+/g, '_');
  const title = titleRaw ? displayEventLabel(titleRaw) : '';
  const description = descriptionRaw ? displayEventLabel(descriptionRaw) : '';

  if (!title && !description && !timestampRaw) return null;

  const id = pickString(record, ['id', 'eventId', 'event_id']) ?? `${index}-${timestampRaw ?? ''}-${title}`;

  return {
    id,
    eventName,
    timestamp: formatTimestamp(timestampRaw ?? pickString(record, TIMESTAMP_KEYS)),
    title,
    description,
  };
}

export function mapInteractionTimelineResponse(payload: unknown): InteractionTimelineEvent[] {
  return unwrapCollection(payload)
    .map((entry, index) => mapEvent(entry, index))
    .filter((event): event is InteractionTimelineEvent => event != null);
}
