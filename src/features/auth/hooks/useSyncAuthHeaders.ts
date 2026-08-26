import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectLoginResponse } from "@/features/auth/authSlice";
import {
  setAccountIdHeader,
  setAuthorizationHeader,
  setSessionId,
} from "@/services/apiClient";

/**
 * Binds the sessionId, Authorization, and accountid headers to the axios
 * instance whenever the logged-in user changes. These headers live in memory,
 * so this also restores them after a page refresh (once redux-persist has
 * rehydrated the auth slice from storage).
 */
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
