import type { Scenario } from './types';
import { exceptionBody, offsetEnvelope } from './envelopes';
import { campaignUsersEnvelope } from '../fixtures/directory';

/**
 * #6 Campaign users —
 * `GET /cms/configuration/cc/{ccId}/process/{processId}/campaign/{campaignId}/campaign-user?limit=1000`
 *
 * Offset pagination, and `metadata.total` is a string. The client asks for
 * `limit=1000` and never pages, so a campaign with more users is silently
 * truncated — a success state that reads as complete data.
 */
export const campaignUsersScenarios: Scenario[] = [
  {
    id: 'CU-200',
    api: 'campaignUsers',
    state: 200,
    title: 'Two campaign users',
    isDefault: true,
    response: { status: 200, body: campaignUsersEnvelope() },
  },
  {
    id: 'CU-200-empty',
    api: 'campaignUsers',
    state: 200,
    title: 'No users on the campaign',
    response: { status: 200, body: offsetEnvelope([], '0') },
  },
  {
    id: 'CU-200-truncated',
    api: 'campaignUsers',
    state: 200,
    title: 'total 5000 but only limit=1000 returned — silent truncation',
    response: { status: 200, body: offsetEnvelope([{ data: { userId: 'agent01', userName: 'Ravi Kumar' } }], '5000') },
  },
  {
    id: 'CU-400',
    api: 'campaignUsers',
    state: 400,
    title: 'Bad Request — bad limit, offset or sortBy',
    response: { status: 400, body: exceptionBody(400, 'Bad Request') },
  },
  {
    id: 'CU-401',
    api: 'campaignUsers',
    state: 401,
    title: 'Unauthorized — refreshed and retried once',
    response: { status: 401, body: exceptionBody(401, 'Unauthorized') },
  },
  {
    id: 'CU-403',
    api: 'campaignUsers',
    state: 403,
    title: 'Forbidden — no rights on the CC, process or campaign',
    response: { status: 403, body: exceptionBody(403, 'Forbidden') },
  },
  {
    id: 'CU-404',
    api: 'campaignUsers',
    state: 404,
    errorCode: 'CONF-1001',
    title: 'Not Found — unknown CC, process or campaign id',
    response: {
      status: 404,
      body: exceptionBody(404, 'Not Found', 'CONF-1001', "Object doesn't exist"),
    },
  },
  {
    id: 'CU-500',
    api: 'campaignUsers',
    state: 500,
    title: 'Internal Server Error',
    response: { status: 500, body: exceptionBody(500, 'Internal Server Error') },
  },
];
