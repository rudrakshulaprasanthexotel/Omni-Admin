import type { Scenario } from './types';
import { exceptionBody } from './envelopes';
import { campaignQueues } from '../fixtures/directory';

/**
 * #4 Campaign queues —
 * `GET /cms/configuration/hierarchyconfig/campaign/{campaignId}/getAllAgentQueueDetailedByCampaign`
 *
 * A bare JSON array, unusually for CMS — no `CommonResponse` wrapper, so there
 * is no inner `http_code` to inspect. Every state below 200 renders as the
 * same empty Queue filter.
 */
export const campaignQueuesScenarios: Scenario[] = [
  {
    id: 'CQ-200',
    api: 'campaignQueues',
    state: 200,
    title: 'Two queues',
    isDefault: true,
    response: { status: 200, body: campaignQueues() },
  },
  {
    id: 'CQ-200-empty',
    api: 'campaignQueues',
    state: 200,
    title: 'Empty array — indistinguishable in the UI from every error state',
    response: { status: 200, body: [] },
  },
  {
    id: 'CQ-400',
    api: 'campaignQueues',
    state: 400,
    title: 'Bad Request — non-numeric campaignId',
    response: { status: 400, body: exceptionBody(400, 'Bad Request') },
  },
  {
    id: 'CQ-401',
    api: 'campaignQueues',
    state: 401,
    title: 'Unauthorized — refreshed and retried once',
    response: { status: 401, body: exceptionBody(401, 'Unauthorized') },
  },
  {
    id: 'CQ-403',
    api: 'campaignQueues',
    state: 403,
    title: 'Forbidden — no rights on the campaign',
    response: { status: 403, body: exceptionBody(403, 'Forbidden') },
  },
  {
    id: 'CQ-404',
    api: 'campaignQueues',
    state: 404,
    errorCode: 'CONF-1001',
    title: 'Not Found — unknown campaignId',
    response: {
      status: 404,
      body: exceptionBody(404, 'Not Found', 'CONF-1001', "Object doesn't exist"),
    },
  },
  {
    id: 'CQ-500',
    api: 'campaignQueues',
    state: 500,
    title: 'Internal Server Error',
    response: { status: 500, body: exceptionBody(500, 'Internal Server Error') },
  },
];
