import type { Scenario } from './types';
import { ameyoError, servletErrorPage } from './envelopes';
import { assignedProcesses } from '../fixtures/directory';

/** #3 Assigned processes — `GET /ameyorestapi/cc/processes/getAssigned` */
export const assignedProcessesScenarios: Scenario[] = [
  {
    id: 'AP-200',
    api: 'assignedProcesses',
    state: 200,
    title: 'One assigned process',
    isDefault: true,
    response: { status: 200, body: assignedProcesses() },
  },
  {
    id: 'AP-200-empty',
    api: 'assignedProcesses',
    state: 200,
    title: 'Empty array — still a 200',
    response: { status: 200, body: [] },
  },
  {
    id: 'AP-401',
    api: 'assignedProcesses',
    state: 401,
    errorCode: '909090',
    title: 'Unauthorized — invalid.authentication.token',
    response: {
      status: 401,
      body: ameyoError(401, 909090, 'invalid.authentication.token', 'Invalid token'),
    },
  },
  {
    id: 'AP-403',
    api: 'assignedProcesses',
    state: 403,
    errorCode: '99999',
    title: 'Forbidden — message is null and the key sits in info instead',
    response: { status: 403, body: ameyoError(403, 99999, null, 'invalid.session.id') },
  },
  {
    id: 'AP-404',
    api: 'assignedProcesses',
    state: 404,
    errorCode: '99999',
    title: 'Not Found — requested.resource.not.found',
    response: {
      status: 404,
      body: ameyoError(404, 99999, 'requested.resource.not.found', 'Not found'),
    },
  },
  {
    id: 'AP-405',
    api: 'assignedProcesses',
    state: 405,
    title: 'Method Not Allowed — the ?info=true trap',
    response: {
      status: 405,
      body: ameyoError(405, 0, 'method.not.allowed', 'Method not allowed'),
    },
  },
  {
    id: 'AP-500-uncaught',
    api: 'assignedProcesses',
    state: 500,
    title: 'Uncaught NullPointerException — HTML body, not the Ameyo envelope',
    response: { status: 500, text: servletErrorPage(), contentType: 'text/html' },
  },
  {
    id: 'AP-512',
    api: 'assignedProcesses',
    state: 512,
    title: '512 — user.not.assigned.to.any.campaign',
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
