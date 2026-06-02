import { createSlice } from "@reduxjs/toolkit";
import type { LoginResponse } from "./types";
import { login, refreshToken } from "./asyncActions";
import type { RootState } from "@/store";

interface AuthState {
  loginResponse: LoginResponse | null;
  loginLoading: boolean;
  loginError: string | null;
}

const initialState: AuthState = {
  loginResponse: null,
  loginLoading: false,
  loginError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearLoginResponse(state) {
      state.loginResponse = null;
      state.loginError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.loginResponse = action.payload;
        state.loginError = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload as string;
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
export const selectLoginResponse = (state: RootState) => state.auth.loginResponse;

export const { clearLoginResponse } = authSlice.actions;
export default authSlice.reducer;
