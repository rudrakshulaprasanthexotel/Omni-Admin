import { createSlice } from "@reduxjs/toolkit";
import type { LoginResponse } from "./types";
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
        state.loginResponse = action.payload;
        state.loginError = null;
        state.loginErrorCode = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload?.message ?? action.error.message ?? "Login failed";
        state.loginErrorCode = action.payload?.errorCode ?? null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        if (state.loginResponse) {
          state.loginResponse.authenticationState.authPolicyVsUserInfo["auth.type.passwd"].loginProperties.jwt =
            action?.payload?.jwtToken ?? "";
        }
      })
  },
});

export const selectLoginLoading = (state: RootState) => state.auth.loginLoading;
export const selectLoginError = (state: RootState) => state.auth.loginError;
export const selectLoginErrorCode = (state: RootState) => state.auth.loginErrorCode;
export const selectLoginResponse = (state: RootState) => state.auth.loginResponse;

export const { clearLoginResponse } = authSlice.actions;
export default authSlice.reducer;
