import { apiClient, setAuthorizationHeader, setSessionId } from '@/services/apiClient';
import type {
  IKeepAliveWithPingPushRequestInputBean,
  ILoginRequestInputBean,
  ILogoutRequestInputBean,
  IRefreshTokenRequestInputBean,
  IRefreshTokenResponse,
  LoginResponse,
} from './types';

export async function loginRequest(input: ILoginRequestInputBean): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/ameyorestapi/userLogin/login', input, {
    headers: { Authorization: undefined },
  });

  setSessionId(data.userSessionInfo.sessionId);
  setAuthorizationHeader(
    data.authenticationState.authPolicyVsUserInfo['auth.type.passwd'].loginProperties.jwt,
  );

  return data;
}

export async function logoutRequest(input: ILogoutRequestInputBean): Promise<void> {
  await apiClient.post('/ameyorestapi/session/userLogout', input);
}

export async function keepAliveRequest(
  input: IKeepAliveWithPingPushRequestInputBean,
): Promise<void> {
  await apiClient.post('/ameyorestapi/session/keepAliveWithPingPush', input);
}

export async function refreshTokenRequest(
  input: IRefreshTokenRequestInputBean,
): Promise<string> {
  const { data } = await apiClient.post<IRefreshTokenResponse>(
    '/ameyorestapi/session/refreshToken',
    input,
  );

  setAuthorizationHeader(data.jwtToken);

  return data.jwtToken;
}
