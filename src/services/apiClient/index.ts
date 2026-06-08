import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AmeyoLogger from '@/services/ameyoLogger/logger';
import type { RootState } from '@/store';
import { refreshToken } from '@/features/auth/asyncActions';
import { clearLoginResponse } from '@/features/auth/authSlice';
import type { Store } from '@reduxjs/toolkit';

const logger = AmeyoLogger.get('ApiClient');


const apiClient: AxiosInstance = axios.create({
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

const REFRESH_TOKEN_URL = '/ameyorestapi/session/refreshToken';
const LOGIN_URL = '/ameyorestapi/userLogin/login';

// Single-flight refresh: concurrent 401s share one refresh call.
let refreshPromise: Promise<string> | null = null;

async function refreshAuthToken(store: Store<RootState>): Promise<string> {
  const userId = store.getState()?.auth?.loginResponse?.userSessionInfo?.userId ?? '';
  const result = await store.dispatch(refreshToken({ userId }) as any).unwrap();
  return result.jwtToken;
}

export function setupApiClientInterceptors(store: Store<RootState>): void {
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      logger.debug('Request:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      logger.error('Request interceptor error:', error);
      return Promise.reject(error);
    },
  );

  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<any>) => {
      const originalRequest = error.config
        ? ({ ...error.config } as InternalAxiosRequestConfig & { _retry?: boolean })
        : undefined;
      
      const status = error.response?.status;
      const isRefreshCall = originalRequest?.url?.includes(REFRESH_TOKEN_URL);
      const isLoginCall = originalRequest?.url?.includes(LOGIN_URL);
      const hasSession = Boolean(store.getState()?.auth?.loginResponse?.userSessionInfo?.sessionId);
  
      if (
        status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isRefreshCall &&
        !isLoginCall &&
        hasSession
      ) {
        originalRequest._retry = true;
        try {
          if (!refreshPromise) {
            refreshPromise = refreshAuthToken(store);
          }
          const pendingRefresh = refreshPromise;
          const newJwt = await pendingRefresh;
          if (refreshPromise === pendingRefresh) {
            refreshPromise = null;
          }
  
          originalRequest.headers.set('Authorization', newJwt);
  
          logger.debug('Retrying request with refreshed token:', originalRequest.url);
          return apiClient(originalRequest);
        } catch (refreshError) {
          refreshPromise = null;
          store.dispatch(clearLoginResponse());
          logger.error('Token refresh failed:', refreshError);
          return Promise.reject(refreshError);
        }
      }
  
      logger.error(
        'Response error:',
        status,
        error.response?.data?.message || error.message,
      );
      return Promise.reject(error);
    },
  );
}



export function setSessionId(sessionId: string): void {
  apiClient.defaults.headers.common['sessionId'] = sessionId;
}

export function setAuthorizationHeader(bearerToken: string): void {
  apiClient.defaults.headers.common['Authorization'] = bearerToken;
}

export { apiClient };
