import type { Scenario } from './types';
import { ameyoError } from './envelopes';
import { assignedCampaigns } from '../fixtures/directory';

/** #2 Assigned campaigns — `GET /ameyorestapi/cc/campaigns/getAssigned` */
export const assignedCampaignsScenarios: Scenario[] = [
  {
    id: 'AC-200',
    api: 'assignedCampaigns',
    state: 200,
    title: 'Two campaigns in one process',
    isDefault: true,
    response: { status: 200, body: assignedCampaigns() },
  },
  {
    id: 'AC-200-empty',
    api: 'assignedCampaigns',
    state: 200,
    title: 'Empty array — still a 200',
    response: { status: 200, body: [] },
  },
  {
    id: 'AC-401',
    api: 'assignedCampaigns',
    state: 401,
    errorCode: '909090',
    title: 'Unauthorized — invalid.authentication.token',
    response: {
      status: 401,
      body: ameyoError(401, 909090, 'invalid.authentication.token', 'Invalid token'),
    },
  },
  {
    id: 'AC-403',
    api: 'assignedCampaigns',
    state: 403,
    title: 'Forbidden — null sessionId or PrivilegeException',
    response: { status: 403, body: ameyoError(403, 0, 'access.denied', 'Access denied') },
  },
  {
    id: 'AC-404',
    api: 'assignedCampaigns',
    state: 404,
    title: 'Not Found — responseBean null (unreachable in practice)',
    response: {
      status: 404,
      body: ameyoError(404, 0, 'requested.resource.not.found', 'Not found'),
    },
  },
  {
    id: 'AC-405',
    api: 'assignedCampaigns',
    state: 405,
    title: 'Method Not Allowed — the ?info=true trap',
    response: {
      status: 405,
      body: ameyoError(405, 0, 'method.not.allowed', 'Method not allowed'),
    },
  },
  {
    id: 'AC-512',
    api: 'assignedCampaigns',
    state: 512,
    title: '512 — user.not.found (non-standard status)',
    response: { status: 512, body: ameyoError(512, 0, 'user.not.found', 'User not found') },
  },
  {
    id: 'AC-512-no-assignments',
    api: 'assignedCampaigns',
    state: 512,
    title: '512 — user.not.assigned.to.any.campaign, a benign state sent as a server error',
    response: {
      status: 512,
      body: ameyoError(
        512,
        0,
        'user.not.assigned.to.any.campaign',
        'User is not assigned to any campaign',
      ),
    },
  },
];
