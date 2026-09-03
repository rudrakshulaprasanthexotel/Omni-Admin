import type { Scenario } from './types';
import { ameyoError, servletErrorPage } from './envelopes';
import { campaignDispositions } from '../fixtures/directory';

/**
 * #5 Campaign disposition codes —
 * `GET /ameyorestapi/cc/dispositionCodes/getByCampaign?campaignId=&info=false`
 *
 * The widest state set of any API here: eight. The only Ameyo endpoint in this
 * set with both a `400` and a bare uncaught `500` alongside the handled `512`.
 */
export const campaignDispositionsScenarios: Scenario[] = [
  {
    id: 'CD-200',
    api: 'campaignDispositions',
    state: 200,
    title: 'Two disposition codes (no class name in the payload)',
    isDefault: true,
    response: { status: 200, body: campaignDispositions() },
  },
  {
    id: 'CD-200-empty',
    api: 'campaignDispositions',
    state: 200,
    title: 'Empty array — reads the same as the per-campaign 403',
    response: { status: 200, body: [] },
  },
  {
    id: 'CD-400',
    api: 'campaignDispositions',
    state: 400,
    errorCode: '40001',
    title: 'Bad Request — InvalidInput, info names the missing parameter',
    response: {
      status: 400,
      body: ameyoError(400, 40001, 'InvalidInput', 'parameter expected in input: campaignId'),
    },
  },
  {
    id: 'CD-401',
    api: 'campaignDispositions',
    state: 401,
    errorCode: '909090',
    title: 'Unauthorized — invalid.authentication.token',
    response: {
      status: 401,
      body: ameyoError(401, 909090, 'invalid.authentication.token', 'Invalid token'),
    },
  },
  {
    id: 'CD-403',
    api: 'campaignDispositions',
    state: 403,
    title: 'Forbidden — per-campaign privilege check, the likeliest real error here',
    response: { status: 403, body: ameyoError(403, 0, 'access.denied', 'Access denied') },
  },
  {
    id: 'CD-404',
    api: 'campaignDispositions',
    state: 404,
    errorCode: '99999',
    title: 'Not Found — a live state on this endpoint, unlike #2 and #3',
    response: {
      status: 404,
      body: ameyoError(404, 99999, 'requested.resource.not.found', 'Not found'),
    },
  },
  {
    id: 'CD-405',
    api: 'campaignDispositions',
    state: 405,
    title: 'Method Not Allowed — the ?info=true trap the client avoids',
    response: {
      status: 405,
      body: ameyoError(405, 0, 'method.not.allowed', 'Method not allowed'),
    },
  },
  {
    id: 'CD-500-uncaught',
    api: 'campaignDispositions',
    state: 500,
    title: 'Uncaught NullPointerException — HTML body, not the Ameyo envelope',
    response: { status: 500, text: servletErrorPage(), contentType: 'text/html' },
  },
  {
    id: 'CD-512',
    api: 'campaignDispositions',
    state: 512,
    title: '512 — DispositionException or ServiceInvocationException',
    response: {
      status: 512,
      body: ameyoError(512, 0, 'disposition.fetch.failed', 'Disposition fetch failed'),
    },
  },
];
