import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectLoginResponse } from "@/features/auth/authSlice";
import { setAuthorizationHeader, setSessionId } from "@/services/apiClient";

/**
 * Binds the sessionId and Authorization headers to the axios instance whenever
 * the logged-in user changes. These headers live in memory, so this also
 * restores them after a page refresh (once redux-persist has rehydrated the
 * auth slice from storage).
 */
export function useSyncAuthHeaders(): void {
  const loginResponse = useAppSelector(selectLoginResponse);

  useEffect(() => {
    if (!loginResponse) return;

    const sessionId = loginResponse.userSessionInfo?.sessionId;
    if (sessionId) setSessionId(sessionId);

    const jwt =
      loginResponse.authenticationState?.authPolicyVsUserInfo?.["auth.type.passwd"]
        ?.loginProperties?.jwt;
    if (jwt) setAuthorizationHeader(jwt);
  }, [loginResponse]);
}
