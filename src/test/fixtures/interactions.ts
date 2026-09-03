import { REQUEST_ID } from '../scenarios/envelopes';

/**
 * Interaction-list fixtures (#1).
 *
 * Written in **snake_case** on purpose. The generated `InteractionOutPutBean`
 * type declares camelCase keys, but the Java bean carries
 * `@JsonNaming(SnakeCaseStrategy)`, so snake_case is what actually arrives.
 * `mapInteraction.pickField` accepts both; using the real wire shape means the
 * tests exercise the branch production traffic hits.
 */
export function interactionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'int-1',
    title: 'Outbound call',
    customer_id: 'cust-1',
    customer_name: 'Nita Sharma',
    last_assigned_user_id: 'agent01',
    last_assigned_user_name: 'Ravi Kumar',
    contact_center_id: 100,
    process_id: 1,
    last_campaign_id: 42,
    last_campaign_name: 'Outbound Sales',
    last_queue_id: 5,
    last_queue_name: 'Hindi',
    last_disposition: 'Interested',
    interaction_media_id: 'd576-643672f4-vcall-0',
    channel_name: 'voice',
    sub_channel: 'inbound',
    direction: 'inbound',
    date_added: '2026-08-30T11:22:33Z',
    date_modified: '2026-08-30T11:25:41Z',
    date_disposed: '2026-08-30T11:25:41Z',
    interaction_relation_id: 'rel-1',
    status: 'closed',
    reopen_count: 0,
    first_assigned_date: '2026-08-30T11:22:40Z',
    channel_data: {
      duration: 185,
      last_did: '080-1234-5678',
      customer_contact: '98XXXXXX53',
      voice_log_url: '/voice-logs/int-1.mp3',
    },
    additional_info: {
      last_disposition_class: 'Sales',
      last_disposition_name: 'Interested',
      case_id: 'CASE-9001',
    },
    ...overrides,
  };
}

/**
 * One `response[]` entry. Each carries its **own** `http_code` and
 * `error_data`, so a transport-level 200 can contain individually failed rows
 * (see `IL-200-partial-row-failure`).
 */
export function rowEntry(
  data: unknown,
  { httpCode = 200, errorData = null as unknown } = {},
) {
  return { http_code: httpCode, error_data: errorData, data };
}

/** A failed row: 200 at the transport layer, no `data`, error inline. */
export function failedRowEntry(errorData = 'Invalid input for parameter') {
  return rowEntry(null, { httpCode: 400, errorData });
}

export interface CursorMetadataOptions {
  /**
   * `metadata.total_string` is a string, not a number: an exact count
   * (`"1000"`), a lower bound (`"1000+"`, `"more than 1000"`), or `"many"`.
   */
  totalString?: string;
  count?: number;
  limit?: number;
  /** Cursor value embedded in `next_page_url`; omit for the last page. */
  afterCursor?: string | null;
  /** Cursor value embedded in `prev_page_url`; omit for the first page. */
  beforeCursor?: string | null;
}

export function cursorMetadata({
  totalString = '2',
  count = 2,
  limit = 50,
  afterCursor = null,
  beforeCursor = null,
}: CursorMetadataOptions = {}) {
  const base = '/v1/cc-list/100/process-list/1/interactions';
  return {
    total_string: totalString,
    count,
    limit,
    first_page_url: base,
    prev_page_url: beforeCursor ? `${base}?before_cursor=${beforeCursor}` : undefined,
    next_page_url: afterCursor ? `${base}?after_cursor=${afterCursor}` : undefined,
  };
}

/** `CommonResponseListCustomDataResponseInteractionOutPutBeanCustomCursorMetadata`. */
export function interactionListEnvelope(
  entries: unknown[],
  metadata: ReturnType<typeof cursorMetadata> | null = cursorMetadata({
    count: entries.length,
    totalString: String(entries.length),
  }),
) {
  return {
    http_code: 200,
    method: 'GET',
    request_id: REQUEST_ID,
    response: entries,
    ...(metadata ? { metadata } : {}),
  };
}

/** Two healthy rows plus cursors on both sides — the default happy path. */
export function twoInteractionPage() {
  return interactionListEnvelope(
    [
      rowEntry(interactionRow()),
      rowEntry(
        interactionRow({
          id: 'int-2',
          interaction_relation_id: 'rel-2',
          customer_name: 'Arjun Mehta',
          last_assigned_user_name: 'Priya Nair',
          last_assigned_user_id: 'agent02',
          channel_name: 'whatsapp',
          direction: 'outbound_manual',
          last_queue_name: 'English',
          last_disposition: 'Callback',
          channel_data: {
            duration: 42,
            customer_contact: 'arjun@example.com',
            chat_transcript_url: '/transcripts/int-2.json',
          },
        }),
      ),
    ],
    cursorMetadata({ totalString: '2', count: 2 }),
  );
}
