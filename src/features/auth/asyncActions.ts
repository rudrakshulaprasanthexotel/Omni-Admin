import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient, setAuthorizationHeader, setSessionId } from "@/services/apiClient";
import { normaliseAxiosResponse, type NormalisedAxiosResponse } from "@/shared/utils/normaliseAxiosResponse";
import type { IRefreshTokenResponse, IKeepAliveWithPingPushRequestInputBean, ILoginRequestInputBean, ILogoutRequestInputBean, IRefreshTokenRequestInputBean, LoginResponse } from "./types";
import { AxiosError } from "axios";

export const login = createAsyncThunk<NormalisedAxiosResponse<LoginResponse>, ILoginRequestInputBean, { rejectValue: NormalisedAxiosResponse }>(
  "auth/login",
  async (input, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<LoginResponse>(
        "/ameyorestapi/userLogin/login",
        input,
        {
          headers: {
            Authorization: undefined
          }
        }
      );

      setSessionId(response.data.userSessionInfo.sessionId);
      setAuthorizationHeader(response.data.authenticationState.authPolicyVsUserInfo['auth.type.passwd'].loginProperties.jwt ?? undefined);

      return normaliseAxiosResponse(response, 'success');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: "Login failed",
      });
    }
  },
);

export const logout = createAsyncThunk<NormalisedAxiosResponse, ILogoutRequestInputBean, { rejectValue: NormalisedAxiosResponse }>(
  "auth/logout",
  async (input, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<unknown>(
        "/ameyorestapi/session/userLogout",
        input
      );
      return normaliseAxiosResponse(response, 'success');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: "Logout failed",
      });
    }
  }
);

export const keepAliveWithPingPush = createAsyncThunk<NormalisedAxiosResponse, IKeepAliveWithPingPushRequestInputBean, { rejectValue: NormalisedAxiosResponse }>(
  "auth/keepAliveWithPingPush",
  async (input, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<unknown>(
        "/ameyorestapi/session/keepAliveWithPingPush",
        input
      );
      return normaliseAxiosResponse(response, 'success');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: "Keep alive with ping push failed",
      });
    }
  }
);

export const refreshToken = createAsyncThunk<NormalisedAxiosResponse<IRefreshTokenResponse>, IRefreshTokenRequestInputBean, { rejectValue: NormalisedAxiosResponse }>(
  "auth/refreshToken",
  async (input, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<IRefreshTokenResponse>(
        "/ameyorestapi/session/refreshToken",
        input
      );

      setAuthorizationHeader(response.data.jwtToken);

      return normaliseAxiosResponse(response, 'success');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: "Refresh token failed",
      });
    }
  }
);
