import type { Scenario } from './types';
import { ameyoError } from './envelopes';
import { loginResponse } from '../fixtures/auth';

/**
 * Not part of the documented 13, but required for any of the `401` states to
 * behave realistically: the response interceptor refreshes single-flight and
 * retries once, and tears the session down when the refresh itself fails.
 */
export const refreshTokenScenarios: Scenario[] = [
  {
    id: 'RT-200',
    api: 'refreshToken',
    state: 200,
    title: 'Refresh succeeds, returning a new JWT',
    isDefault: true,
    response: { status: 200, body: { jwtToken: 'jwt-refreshed' } },
  },
  {
    id: 'RT-401',
    api: 'refreshToken',
    state: 401,
    errorCode: '909090',
    title: 'Refresh itself rejected — session is torn down',
    response: {
      status: 401,
      body: ameyoError(401, 909090, 'invalid.authentication.token', 'Invalid token'),
    },
  },
];

export const logoutScenarios: Scenario[] = [
  {
    id: 'LO-200',
    api: 'logout',
    state: 200,
    title: 'Logout accepted',
    isDefault: true,
    response: { status: 200, body: { status: 'OK' } },
  },
  {
    id: 'LO-512',
    api: 'logout',
    state: 512,
    title: 'Logout fails — the slice still resets, the session is over either way',
    response: { status: 512, body: ameyoError(512, 0, 'logout.failed', 'Logout failed') },
  },
];

/**
 * Only the browser mock mode uses these: the Vitest suite preloads a signed-in
 * store instead of going through the form. Any credentials are accepted and
 * come back as the same Supervisor, which is the role `/interactions` requires.
 */
export const loginScenarios: Scenario[] = [
  {
    id: 'LG-200',
    api: 'login',
    state: 200,
    title: 'Any credentials sign you in as a Supervisor',
    isDefault: true,
    response: { status: 200, body: loginResponse() },
  },
  {
    id: 'LG-401',
    api: 'login',
    state: 401,
    errorCode: '303030',
    title: 'Credentials rejected',
    response: {
      status: 401,
      body: ameyoError(401, 303030, 'invalid.credentials', 'Invalid credentials'),
    },
  },
  {
    id: 'LG-200-admin',
    api: 'login',
    state: 200,
    title: 'Signs in as an Administrator — /interactions answers Access Denied',
    response: {
      status: 200,
      body: loginResponse({
        userSessionInfo: {
          ...loginResponse().userSessionInfo!,
          userType: 'Administrator',
        },
      }),
    },
  },
];

export const keepAliveScenarios: Scenario[] = [
  {
    id: 'KA-200',
    api: 'keepAlive',
    state: 200,
    title: 'Session ping accepted',
    isDefault: true,
    response: { status: 200, body: { status: 'OK' } },
  },
  {
    id: 'KA-401',
    api: 'keepAlive',
    state: 401,
    title: 'Ping rejected — drives the 401 interceptor on a timer',
    response: {
      status: 401,
      body: ameyoError(401, 909090, 'invalid.authentication.token', 'Invalid token'),
    },
  },
];
