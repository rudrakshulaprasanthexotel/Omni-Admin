import type { Scenario } from './types';
import { interactionSvcError, interactionSvcSuccess } from './envelopes';
import { timelineEvents } from '../fixtures/timeline';

/**
 * #7 Interaction timeline — the third error envelope, and the most granular:
 * eight HTTP codes carrying eleven distinct `error_code` values, four of them
 * behind `404` alone. The HTTP status is too coarse to act on;
 * `response.error_data.error_code` is the field that identifies the condition.
 *
 * `InteractionTimeline.tsx` reads none of it and collapses all eleven into one
 * retryable error, which is exactly what the tests assert today.
 */
export const timelineScenarios: Scenario[] = [
  {
    id: 'TL-200',
    api: 'interactionTimeline',
    state: 200,
    title: 'Three events (note: success responses mislabel method as POST)',
    isDefault: true,
    response: { status: 200, body: interactionSvcSuccess(timelineEvents()) },
  },
  {
    id: 'TL-200-empty',
    api: 'interactionTimeline',
    state: 200,
    title: 'Empty data array — ambiguous between success and silent failure',
    response: { status: 200, body: interactionSvcSuccess([]) },
  },
  {
    id: 'TL-400-IS-1001',
    api: 'interactionTimeline',
    state: 400,
    errorCode: 'IS-1001',
    title: 'Bad Request — ConstraintViolationException from bean validation',
    response: {
      status: 400,
      body: interactionSvcError(400, 'IS-1001', 'validation.failed', 'Bad Request'),
    },
  },
  {
    id: 'TL-400-IS-1003',
    api: 'interactionTimeline',
    state: 400,
    errorCode: 'IS-1003',
    title: 'Bad Request — non-numeric ccId or processId in the path',
    response: {
      status: 400,
      body: interactionSvcError(400, 'IS-1003', 'argument.type.mismatch', 'Bad Request'),
    },
  },
  {
    id: 'TL-401-AUTH-1001',
    api: 'interactionTimeline',
    state: 401,
    errorCode: 'AUTH-1001',
    title: 'Unauthorized — missing, malformed or expired Bearer token',
    response: {
      status: 401,
      body: interactionSvcError(401, 'AUTH-1001', 'auth.token.invalid', 'Unauthorized'),
    },
  },
  {
    id: 'TL-403-AUTH-1002',
    api: 'interactionTimeline',
    state: 403,
    errorCode: 'AUTH-1002',
    title: 'Forbidden — no VIEW_INTERACTION on this process (per-process)',
    response: {
      status: 403,
      body: interactionSvcError(403, 'AUTH-1002', 'access.denied', 'Forbidden'),
    },
  },
  {
    id: 'TL-404-CONF-1001',
    api: 'interactionTimeline',
    state: 404,
    errorCode: 'CONF-1001',
    // Same string as the data-engine/CMS CONF-1001 but a different meaning:
    // CC_NOT_FOUND here vs the generic "Object doesn't exist" there.
    title: 'Not Found — CC_NOT_FOUND (ccId absent from the config cache)',
    response: {
      status: 404,
      body: interactionSvcError(404, 'CONF-1001', 'cc.not.found', 'Not Found'),
    },
  },
  {
    id: 'TL-404-CONF-1002',
    api: 'interactionTimeline',
    state: 404,
    errorCode: 'CONF-1002',
    title: 'Not Found — PROCESS_NOT_FOUND',
    response: {
      status: 404,
      body: interactionSvcError(404, 'CONF-1002', 'process.not.found', 'Not Found'),
    },
  },
  {
    id: 'TL-404-INTERACTION-1001',
    api: 'interactionTimeline',
    state: 404,
    errorCode: 'INTERACTION-1001',
    title: 'Not Found — the interaction genuinely does not exist',
    response: {
      status: 404,
      body: interactionSvcError(404, 'INTERACTION-1001', 'interaction.not.found', 'Not Found'),
    },
  },
  {
    id: 'TL-404-INTERACTION-1007',
    api: 'interactionTimeline',
    state: 404,
    errorCode: 'INTERACTION-1007',
    title: 'Not Found — stored timeline JSON is corrupt, retrying never helps',
    response: {
      status: 404,
      body: interactionSvcError(
        404,
        'INTERACTION-1007',
        'interaction.timeline.not.found',
        'Not Found',
      ),
    },
  },
  {
    id: 'TL-405-IS-1003',
    api: 'interactionTimeline',
    state: 405,
    errorCode: 'IS-1003',
    title: 'Method Not Allowed — wrong verb',
    response: {
      status: 405,
      body: interactionSvcError(405, 'IS-1003', 'method.not.allowed', 'Method Not Allowed'),
    },
  },
  {
    id: 'TL-406-IS-1003',
    api: 'interactionTimeline',
    state: 406,
    errorCode: 'IS-1003',
    title: 'Not Acceptable — Accept header incompatible with application/json',
    response: {
      status: 406,
      body: interactionSvcError(406, 'IS-1003', 'not.acceptable', 'Not Acceptable'),
    },
  },
  {
    id: 'TL-500-INTERACTION-1006',
    api: 'interactionTimeline',
    state: 500,
    errorCode: 'INTERACTION-1006',
    title: '500 — timeline not dumped yet (open or just-closed): benign and retryable',
    response: {
      status: 500,
      body: interactionSvcError(
        500,
        'INTERACTION-1006',
        'appserver.timeline.not.found',
        'Internal Server Error',
      ),
    },
  },
  {
    id: 'TL-500-IS-1002',
    api: 'interactionTimeline',
    state: 500,
    errorCode: 'IS-1002',
    title: '500 — generic unhandled exception',
    response: {
      status: 500,
      body: interactionSvcError(500, 'IS-1002', 'internal.error', 'Internal Server Error'),
    },
  },
];
