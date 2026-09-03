import type { Scenario } from './types';
import { exceptionBody } from './envelopes';
import {
  cursorMetadata,
  failedRowEntry,
  interactionListEnvelope,
  interactionRow,
  rowEntry,
  twoInteractionPage,
} from '../fixtures/interactions';

/** #1 Interaction list — `GET /data-engine/v1/cc-list/{ccId}/process-list/{processId}/interactions` */
export const interactionListScenarios: Scenario[] = [
  {
    id: 'IL-200',
    api: 'interactionList',
    state: 200,
    title: 'Two rows with cursors on both sides',
    isDefault: true,
    response: { status: 200, body: twoInteractionPage() },
  },
  {
    id: 'IL-200-empty',
    api: 'interactionList',
    state: 200,
    title: 'Empty page — a valid 200, renders the empty overlay',
    response: {
      status: 200,
      body: interactionListEnvelope([], cursorMetadata({ totalString: '0', count: 0 })),
    },
  },
  {
    id: 'IL-200-partial',
    api: 'interactionList',
    state: 200,
    title: 'Partial row failure — 200 carrying a failed entry inline',
    response: {
      status: 200,
      // Each `response[]` entry has its own `http_code`/`error_data`. The
      // client maps `entry.data` and filters nulls, so this page silently
      // comes back one row short with no explanation to the user.
      body: interactionListEnvelope(
        [
          rowEntry(interactionRow()),
          failedRowEntry(),
          rowEntry(
            interactionRow({
              id: 'int-3',
              interaction_relation_id: 'rel-3',
              customer_name: 'Meera Iyer',
              last_assigned_user_name: 'Sanjay Rao',
              last_assigned_user_id: 'agent03',
            }),
          ),
        ],
        cursorMetadata({ totalString: '3', count: 3 }),
      ),
    },
  },
  {
    id: 'IL-200-total-many',
    api: 'interactionList',
    state: 200,
    title: 'total_string "many" — unparseable, pager hides the total',
    response: {
      status: 200,
      body: interactionListEnvelope(
        [rowEntry(interactionRow())],
        cursorMetadata({ totalString: 'many', count: 1 }),
      ),
    },
  },
  {
    id: 'IL-200-total-plus',
    api: 'interactionList',
    state: 200,
    title: 'total_string "1000+" — lower bound, strips the trailing plus',
    response: {
      status: 200,
      body: interactionListEnvelope(
        [rowEntry(interactionRow())],
        cursorMetadata({ totalString: '1000+', count: 1 }),
      ),
    },
  },
  {
    id: 'IL-200-total-more-than',
    api: 'interactionList',
    state: 200,
    title: 'total_string "more than 1000" — prose lower bound',
    response: {
      status: 200,
      body: interactionListEnvelope(
        [rowEntry(interactionRow())],
        cursorMetadata({ totalString: 'more than 1000', count: 1 }),
      ),
    },
  },
  {
    id: 'IL-200-next-page',
    api: 'interactionList',
    state: 200,
    title: 'Page with a next cursor — drives forward pagination',
    response: {
      status: 200,
      body: interactionListEnvelope(
        [rowEntry(interactionRow())],
        cursorMetadata({ totalString: '25000', count: 1, afterCursor: 'CURSOR_NEXT' }),
      ),
    },
  },
  {
    id: 'IL-400',
    api: 'interactionList',
    state: 400,
    title: 'Bad Request — malformed date_range, invalid cursor or filter',
    response: { status: 400, body: exceptionBody(400, 'Bad Request') },
  },
  {
    id: 'IL-401',
    api: 'interactionList',
    state: 401,
    title: 'Unauthorized — expired JWT, refreshed and retried once',
    response: { status: 401, body: exceptionBody(401, 'Unauthorized') },
  },
  {
    id: 'IL-403',
    api: 'interactionList',
    state: 403,
    title: 'Forbidden — no rights on the CC, process or campaign',
    response: { status: 403, body: exceptionBody(403, 'Forbidden') },
  },
  {
    id: 'IL-404',
    api: 'interactionList',
    state: 404,
    errorCode: 'CONF-1001',
    title: 'Not Found — unknown ccId or processId',
    response: {
      status: 404,
      body: exceptionBody(404, 'Not Found', 'CONF-1001', "Object doesn't exist"),
    },
  },
  {
    id: 'IL-500',
    api: 'interactionList',
    state: 500,
    title: 'Internal Server Error',
    response: { status: 500, body: exceptionBody(500, 'Internal Server Error') },
  },
  {
    id: 'IL-timeout',
    api: 'interactionList',
    state: 'timeout',
    title: 'Response slower than the axios timeout',
    // Production `apiClient` uses `timeout: 30_000`. Rather than making the
    // suite wait that long (or fight fake timers against both the msw delay
    // and the XHR timeout), the test lowers `apiClient.defaults.timeout`
    // below this delay. Same code path, deterministic, ~300ms.
    response: { status: 200, body: twoInteractionPage(), delayMs: 300 },
  },
  {
    id: 'IL-network',
    api: 'interactionList',
    state: 'network',
    title: 'Transport failure — network down or CORS rejection',
    response: { networkError: true },
  },
];
