import type { Scenario } from './types';
import { ameyoError, servletErrorPage } from './envelopes';
import { contactCenterUsers, customerInfo, userCampaigns } from '../fixtures/directory';

/**
 * #8 All contact-center users — `GET /ameyorestapi/cc/contactCenterUsers/getAllContactCenterUsers`
 *
 * An unscoped bulk fetch of the whole directory, issued to resolve one userId
 * to a name. Bundled with #9 under `Promise.all` in `useUserHoverCard`, so
 * either failing discards both results.
 */
export const contactCenterUsersScenarios: Scenario[] = [
  {
    id: 'CCU-200',
    api: 'contactCenterUsers',
    state: 200,
    title: 'Two users in the directory',
    isDefault: true,
    response: { status: 200, body: contactCenterUsers() },
  },
  {
    id: 'CCU-200-empty',
    api: 'contactCenterUsers',
    state: 200,
    title: 'Empty directory — still a 200',
    response: { status: 200, body: [] },
  },
  {
    id: 'CCU-401',
    api: 'contactCenterUsers',
    state: 401,
    errorCode: '909090',
    title: 'Unauthorized — invalid.authentication.token',
    response: {
      status: 401,
      body: ameyoError(401, 909090, 'invalid.authentication.token', 'Invalid token'),
    },
  },
  {
    id: 'CCU-403',
    api: 'contactCenterUsers',
    state: 403,
    errorCode: '99999',
    title: 'Forbidden — null session; message is null, key sits in info',
    response: { status: 403, body: ameyoError(403, 99999, null, 'invalid.session.id') },
  },
  {
    id: 'CCU-404',
    api: 'contactCenterUsers',
    state: 404,
    errorCode: '99999',
    title: 'Not Found — non-numeric ?ccId (JAX-RS maps conversion failures to 404)',
    response: {
      status: 404,
      body: ameyoError(404, 99999, 'requested.resource.not.found', 'Not found'),
    },
  },
  {
    id: 'CCU-405',
    api: 'contactCenterUsers',
    state: 405,
    title: 'Method Not Allowed — the ?info=true trap this wrapper still exposes',
    response: {
      status: 405,
      body: ameyoError(405, 0, 'method.not.allowed', 'Method not allowed'),
    },
  },
  {
    id: 'CCU-500-uncaught',
    api: 'contactCenterUsers',
    state: 500,
    title: 'Uncaught NPE — one user with null skillLevelIds kills the whole directory',
    response: { status: 500, text: servletErrorPage(), contentType: 'text/html' },
  },
  {
    id: 'CCU-512',
    api: 'contactCenterUsers',
    state: 512,
    title: '512 — config or service invocation failure',
    response: {
      status: 512,
      body: ameyoError(512, 0, 'user.fetch.failed', 'User fetch failed'),
    },
  },
];

/**
 * #9 Campaigns assigned by user — `GET /ameyorestapi/cc/hybrid/campaigns/getAssignedByUserId`
 *
 * Bad input returns `512`, not `400` — this endpoint has no `400` at all.
 */
export const userCampaignsScenarios: Scenario[] = [
  {
    id: 'UC-200',
    api: 'userCampaigns',
    state: 200,
    title: 'One campaign (processId and contactCenterId always null here)',
    isDefault: true,
    response: { status: 200, body: userCampaigns() },
  },
  {
    id: 'UC-200-empty',
    api: 'userCampaigns',
    state: 200,
    title: 'Empty array — has processes but no campaign contexts',
    response: { status: 200, body: [] },
  },
  {
    id: 'UC-401',
    api: 'userCampaigns',
    state: 401,
    errorCode: '909090',
    title: 'Unauthorized — invalid.authentication.token',
    response: {
      status: 401,
      body: ameyoError(401, 909090, 'invalid.authentication.token', 'Invalid token'),
    },
  },
  {
    id: 'UC-403',
    api: 'userCampaigns',
    state: 403,
    errorCode: '99999',
    title: 'Forbidden — message null, key in info',
    response: { status: 403, body: ameyoError(403, 99999, null, 'invalid.session.id') },
  },
  {
    id: 'UC-404',
    api: 'userCampaigns',
    state: 404,
    errorCode: '99999',
    title: 'Not Found — unreachable, the command always returns a list',
    response: {
      status: 404,
      body: ameyoError(404, 99999, 'requested.resource.not.found', 'Not found'),
    },
  },
  {
    id: 'UC-405',
    api: 'userCampaigns',
    state: 405,
    title: 'Method Not Allowed — ?info=true or a non-GET verb',
    response: {
      status: 405,
      body: ameyoError(405, 0, 'method.not.allowed', 'Method not allowed'),
    },
  },
  {
    id: 'UC-500-uncaught',
    api: 'userCampaigns',
    state: 500,
    title: 'Uncaught NPE — getCampaignContextById returned null',
    response: { status: 500, text: servletErrorPage(), contentType: 'text/html' },
  },
  {
    id: 'UC-512-user-not-found',
    api: 'userCampaigns',
    state: 512,
    errorCode: '99999',
    title: '512 — unknown userId reported as a server error; message is an empty string',
    response: { status: 512, body: ameyoError(512, 99999, '', 'user not found') },
  },
  {
    id: 'UC-512-no-processes',
    api: 'userCampaigns',
    state: 512,
    errorCode: '99999',
    title: '512 — user has no process assignments (vs empty 200 for no campaigns)',
    response: {
      status: 512,
      body: ameyoError(512, 99999, '', 'user.not.assigned.to.any.campaign'),
    },
  },
];

/**
 * #10 Customer info — `GET /ameyorestapi/cc/getCustomerInfosForCustomerId`
 *
 * The outlier: a single object rather than a list, no `512`, and **no
 * privilege check at all**, so no `403`. Backend faults fold into `404`
 * alongside "no such customer".
 */
export const customerInfoScenarios: Scenario[] = [
  {
    id: 'CI-200',
    api: 'customerInfo',
    state: 200,
    title: 'Single customer object with maskable customerFields',
    isDefault: true,
    response: { status: 200, body: customerInfo() },
  },
  {
    id: 'CI-400',
    api: 'customerInfo',
    state: 400,
    errorCode: '40001',
    title: 'Bad Request — InvalidInput, info names the missing parameter',
    response: {
      status: 400,
      body: ameyoError(400, 40001, 'InvalidInput', 'parameter expected in input: customerId'),
    },
  },
  {
    id: 'CI-401',
    api: 'customerInfo',
    state: 401,
    errorCode: '909090',
    title: 'Unauthorized — only from the auth filter, no second path',
    response: {
      status: 401,
      body: ameyoError(401, 909090, 'invalid.authentication.token', 'Invalid token'),
    },
  },
  {
    id: 'CI-404',
    api: 'customerInfo',
    state: 404,
    errorCode: '99999',
    title: 'Not Found — no such customer, OR any backend fault, OR a type error',
    response: {
      status: 404,
      body: ameyoError(404, 99999, 'requested.resource.not.found', 'Not found'),
    },
  },
  {
    id: 'CI-405',
    api: 'customerInfo',
    state: 405,
    title: 'Method Not Allowed — wrong verb only; no ?info trap on this one',
    response: {
      status: 405,
      body: ameyoError(405, 0, 'method.not.allowed', 'Method not allowed'),
    },
  },
  {
    id: 'CI-500-uncaught',
    api: 'customerInfo',
    state: 500,
    title: 'Uncaught NullPointerException — HTML body',
    response: { status: 500, text: servletErrorPage(), contentType: 'text/html' },
  },
];
