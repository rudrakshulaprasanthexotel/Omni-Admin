import type { Scenario } from './types';
import { exceptionBody, nestedDataEnvelope } from './envelopes';
import { qaParameters } from '../fixtures/directory';

/**
 * #11 QA denominator —
 * `GET /data-engine/cc-list/{ccId}/process-list/{processId}/campaigns/{campaignId}/campaign-qa-parameter`
 *
 * The thunk exists but nothing dispatches it, so the scoring column renders
 * `—` in the UI regardless. Covered here at the thunk level so the state set
 * is not lost when it does get wired up.
 */
export const qaDenominatorScenarios: Scenario[] = [
  {
    id: 'QAD-200',
    api: 'qaDenominator',
    state: 200,
    title: 'Two QA parameters — the thunk only reads data.length',
    isDefault: true,
    response: { status: 200, body: nestedDataEnvelope(qaParameters()) },
  },
  {
    id: 'QAD-200-empty',
    api: 'qaDenominator',
    state: 200,
    title: 'No QA parameters — denominator resolves to 0',
    response: { status: 200, body: nestedDataEnvelope([]) },
  },
  {
    id: 'QAD-400',
    api: 'qaDenominator',
    state: 400,
    title: 'Bad Request',
    response: { status: 400, body: exceptionBody(400, 'Bad Request') },
  },
  {
    id: 'QAD-401',
    api: 'qaDenominator',
    state: 401,
    title: 'Unauthorized',
    response: { status: 401, body: exceptionBody(401, 'Unauthorized') },
  },
  {
    id: 'QAD-403',
    api: 'qaDenominator',
    state: 403,
    title: 'Forbidden',
    response: { status: 403, body: exceptionBody(403, 'Forbidden') },
  },
  {
    id: 'QAD-404',
    api: 'qaDenominator',
    state: 404,
    errorCode: 'CONF-1001',
    title: 'Not Found',
    response: {
      status: 404,
      body: exceptionBody(404, 'Not Found', 'CONF-1001', "Object doesn't exist"),
    },
  },
  {
    id: 'QAD-500',
    api: 'qaDenominator',
    state: 500,
    title: 'Internal Server Error',
    response: { status: 500, body: exceptionBody(500, 'Internal Server Error') },
  },
];

/**
 * #12 Interaction QA scores. The generated client exists but no feature code
 * calls it, so these scenarios document the state set without a consumer.
 */
export const qaScoresScenarios: Scenario[] = [
  {
    id: 'QAS-200',
    api: 'interactionQaScores',
    state: 200,
    title: 'Per-interaction QA scores',
    isDefault: true,
    response: {
      status: 200,
      body: nestedDataEnvelope([{ interactionId: 'int-1', score: 38, maxScore: 45 }]),
    },
  },
  {
    id: 'QAS-400',
    api: 'interactionQaScores',
    state: 400,
    title: 'Bad Request',
    response: { status: 400, body: exceptionBody(400, 'Bad Request') },
  },
  {
    id: 'QAS-401',
    api: 'interactionQaScores',
    state: 401,
    title: 'Unauthorized',
    response: { status: 401, body: exceptionBody(401, 'Unauthorized') },
  },
  {
    id: 'QAS-403',
    api: 'interactionQaScores',
    state: 403,
    title: 'Forbidden',
    response: { status: 403, body: exceptionBody(403, 'Forbidden') },
  },
  {
    id: 'QAS-404',
    api: 'interactionQaScores',
    state: 404,
    errorCode: 'CONF-1001',
    title: 'Not Found',
    response: {
      status: 404,
      body: exceptionBody(404, 'Not Found', 'CONF-1001', "Object doesn't exist"),
    },
  },
  {
    id: 'QAS-500',
    api: 'interactionQaScores',
    state: 500,
    title: 'Internal Server Error',
    response: { status: 500, body: exceptionBody(500, 'Internal Server Error') },
  },
];
