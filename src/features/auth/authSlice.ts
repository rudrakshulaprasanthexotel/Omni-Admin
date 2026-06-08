import { createSlice } from "@reduxjs/toolkit";
import type { ILoginApiErrorData, LoginResponse } from "./types";
import { login, refreshToken } from "./asyncActions";
import type { RootState } from "@/store";

interface AuthState {
  loginResponse: LoginResponse | null;
  loginLoading: boolean;
  loginError: string | null;
  loginErrorCode: number | null;
}

const initialState: AuthState = {
  loginResponse: null,
  loginLoading: false,
  loginError: null,
  loginErrorCode: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearLoginResponse(state) {
      state.loginResponse = null;
      state.loginError = null;
      state.loginErrorCode = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
        state.loginErrorCode = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.loginResponse = action.payload.response?.data ?? null;
        state.loginError = null;
        state.loginErrorCode = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loginLoading = false;
        const errorData = action.payload?.response?.data as ILoginApiErrorData | undefined;
        state.loginError = action.payload?.message ?? action.error.message ?? "Login failed";
        state.loginErrorCode = errorData?.errorCode ?? null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        if (state.loginResponse) {
          state.loginResponse.authenticationState.authPolicyVsUserInfo["auth.type.passwd"].loginProperties.jwt =
            action.payload.response?.data?.jwtToken ?? "";
        }
      })
  },
});

export const selectLoginLoading = (state: RootState) => state.auth.loginLoading;
export const selectLoginError = (state: RootState) => state.auth.loginError;
export const selectLoginErrorCode = (state: RootState) => state.auth.loginErrorCode;
export const selectLoginResponse = (state: RootState) => state.auth.loginResponse;
export const selectContactCenterId = (state: RootState) => state.auth.loginResponse.contactCenterId;

export const { clearLoginResponse } = authSlice.actions;
export default authSlice.reducer;
