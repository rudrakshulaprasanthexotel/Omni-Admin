import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient, setAuthorizationHeader, setSessionId } from "@/services/apiClient";
import type { ILoginApiErrorData, ILoginRejectValue, IRefreshTokenResponse, IKeepAliveWithPingPushRequestInputBean, ILoginRequestInputBean, ILogoutRequestInputBean, IRefreshTokenRequestInputBean, LoginResponse } from "./types";

export const login = createAsyncThunk<LoginResponse, ILoginRequestInputBean, { rejectValue: ILoginRejectValue }>(
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

      return response.data;
    } catch (error: any) {
      const data: ILoginApiErrorData | undefined = error.response?.data;
      return rejectWithValue({
        message: data?.message || error.message || "Login failed",
        errorCode: data?.errorCode ?? null,
      });
    }
  },
);

export const logout = createAsyncThunk<unknown, ILogoutRequestInputBean>(
  "auth/logout",
  async (input, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<unknown>(
        "/ameyorestapi/session/userLogout",
        input
      )

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Logout failed",
      );
    }
  }
);

export const keepAliveWithPingPush = createAsyncThunk<unknown, IKeepAliveWithPingPushRequestInputBean>(
  "auth/keepAliveWithPingPush",
  async (input, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<unknown>(
        "/ameyorestapi/session/keepAliveWithPingPush",
        input
      )

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Keep alive with ping push failed",
      );
    }
  }
);

export const refreshToken = createAsyncThunk<IRefreshTokenResponse, IRefreshTokenRequestInputBean>(
  "auth/refreshToken",
  async (input, { rejectWithValue}) => {
    try {
      const response = await apiClient.post<IRefreshTokenResponse>(
        "/ameyorestapi/session/refreshToken",
        input
      )

      setAuthorizationHeader(response.data.jwtToken);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Refresh token failed",
      );
    }
  }
);
