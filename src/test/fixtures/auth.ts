import type { LoginResponse } from '@/features/auth/types';

/**
 * The interaction-svc host is not configured statically — it is derived at
 * request time from `interaction.server.domain` / `interaction.server.port` in
 * the login payload (`interactionApis.getInteractionServiceOrigin`). Port 443
 * is dropped by `URL.origin`, so the timeline requests land on exactly this
 * origin. MSW handler patterns are `*`-prefixed and match it regardless.
 */
export const INTERACTION_SVC_ORIGIN = 'https://interaction.test.local';

export const TEST_CC_ID = 100;
export const TEST_PROCESS_ID = 1;
export const TEST_CAMPAIGN_ID = 42;
export const TEST_SESSION_ID = 'sess-test-1';
export const TEST_USER_ID = 'supervisor01';
export const TEST_JWT = 'jwt-initial';

export function loginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    requestId: 'req-test-1',
    contactCenterId: TEST_CC_ID,
    userSessionInfo: {
      userId: TEST_USER_ID,
      terminalInfo: 'test-terminal',
      sessionId: TEST_SESSION_ID,
      loginTime: 1756800000000,
      userType: 'Supervisor',
      lastLoginInfo: {
        userId: TEST_USER_ID,
        userName: 'Test Supervisor',
        lastLoginTime: 1756700000000,
        lastLogoutTime: 1756750000000,
        sessionId: 'sess-test-0',
        localIp: '127.0.0.1',
        publicIp: null,
        clientType: 'web',
        clientVersion: '1.0.0',
        browserInfo: null,
      },
      publicIp: null,
      clientType: 'web',
      clientVersion: '1.0.0',
      browserInfo: null,
      authenticationPolicy: null,
      userName: 'Test Supervisor',
      rootUser: false,
    },
    authenticationState: {
      userId: TEST_USER_ID,
      authPolicyVsUserAuthState: {},
      authPolicyVsUserInfo: {
        'auth.type.passwd': {
          userId: TEST_USER_ID,
          sessionId: TEST_SESSION_ID,
          properties: {
            passwordStateDetail: {
              reason: null,
              passwordValid: true,
              warnUser: false,
              shouldChangePassword: false,
            },
          },
          loginProperties: {
            appType: null,
            appVersion: null,
            mobile_device_source: 'web',
            'cms.server.domain': 'cms.test.local',
            'cms.server.port': '443',
            'data.engine.server.domain': 'data-engine.test.local',
            'data.engine.server.port': '443',
            'cfs.server.domain': 'cfs.test.local',
            'cfs.server.port': '443',
            'customer.manager.server.domain': 'cm.test.local',
            'customer.manager.server.port': '443',
            'callback.server.domain': 'callback.test.local',
            'callback.server.port': '443',
            'interaction.server.domain': 'interaction.test.local',
            'interaction.server.port': '443',
            'crm.connector.server.domain': 'crm.test.local',
            'crm.connector.server.port': '443',
            'chat.service.server.domain': 'chat.test.local',
            'chat.service.server.port': '443',
            'bosh.service.server.domain': 'bosh.test.local',
            'bosh.service.server.port': '443',
            'ccdp.server.domain': 'ccdp.test.local',
            'ccdp.server.port': '443',
            'cqa.server.domain': 'cqa.test.local',
            'cqa.server.port': '443',
            'omni.new.app.ui.redirection.domain': null,
            'nodered.server.domain': 'nodered.test.local',
            'nodered.server.port': '443',
            isSingleDomain: 'false',
            accountId: 'acct-test-1',
            setupId: 'setup-test-1',
            jwt: TEST_JWT,
            jwtTokenExpiryMs: '900000',
            contact_center_id: String(TEST_CC_ID),
            stamp_version: '1',
          },
        },
      },
    },
    configurations: {},
    ...overrides,
  };
}
