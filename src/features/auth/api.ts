import { setAuthorizationHeader, setSessionId } from '@/services/apiClient';
import { appServerApis } from '@/services/apiClient/appServerApis';
import type {
  IKeepAliveWithPingPushRequestInputBean,
  ILoginRequestInputBean,
  ILogoutRequestInputBean,
  IRefreshTokenRequestInputBean,
  LoginResponse,
} from './types';

export async function loginRequest(input: ILoginRequestInputBean): Promise<LoginResponse> {
  const { data } = await appServerApis.login(input);

  setSessionId(data.userSessionInfo.sessionId);
  setAuthorizationHeader(
    data.authenticationState.authPolicyVsUserInfo['auth.type.passwd'].loginProperties.jwt,
  );

  return data;
}

export async function logoutRequest(input: ILogoutRequestInputBean): Promise<void> {
  await appServerApis.logout(input);
}

export async function keepAliveRequest(
  input: IKeepAliveWithPingPushRequestInputBean,
): Promise<void> {
  await appServerApis.keepAliveWithPingPush(input);
}

export async function refreshTokenRequest(
  input: IRefreshTokenRequestInputBean,
): Promise<string> {
  const { data } = await appServerApis.refreshToken(input);

  setAuthorizationHeader(data.jwtToken);

  return data.jwtToken;
}
