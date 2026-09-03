import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectLoginResponse } from "@/features/auth/authSlice";
import {
  setAccountIdHeader,
  setAuthorizationHeader,
  setSessionId,
} from "@/services/apiClient";

export function useSyncAuthHeaders(): void {
  const loginResponse = useAppSelector(selectLoginResponse);

  useEffect(() => {
    if (!loginResponse) return;

    const sessionId = loginResponse.userSessionInfo?.sessionId;
    if (sessionId) setSessionId(sessionId);

    const loginProperties =
      loginResponse.authenticationState?.authPolicyVsUserInfo?.["auth.type.passwd"]
        ?.loginProperties;

    const jwt = loginProperties?.jwt;
    if (jwt) setAuthorizationHeader(jwt);

    const accountId = loginProperties?.accountId;
    if (accountId) setAccountIdHeader(accountId);
  }, [loginResponse]);
}
