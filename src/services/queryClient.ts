import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

const MAX_RETRIES = 2;
const SERVER_ERROR_FLOOR = 500;

/**
 * 4xx responses are caller errors (bad filter, missing privilege, expired
 * session) — retrying them only delays the error state. The axios interceptor
 * already handles the one 4xx worth retrying (401 → refresh → replay).
 */
function retryOnServerError(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  const status = error instanceof AxiosError ? error.response?.status : undefined;
  return status === undefined || status >= SERVER_ERROR_FLOOR;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: retryOnServerError,
    },
    mutations: {
      retry: false,
    },
  },
});
