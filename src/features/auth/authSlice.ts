import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LoginResponse } from "./types";
import type { RootState } from "@/store";

interface AuthState {
  loginResponse: LoginResponse | null;
}

const initialState: AuthState = {
  loginResponse: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoginResponse(state, action: PayloadAction<LoginResponse>) {
      state.loginResponse = action.payload;
    },
    setJwt(state, action: PayloadAction<string>) {
      if (state.loginResponse) {
        state.loginResponse.authenticationState.authPolicyVsUserInfo["auth.type.passwd"].loginProperties.jwt =
          action.payload;
      }
    },
    clearLoginResponse(state) {
      state.loginResponse = null;
    },
  },
});

export const selectLoginResponse = (state: RootState) => state.auth.loginResponse;
export const selectContactCenterId = (state: RootState) => state.auth.loginResponse?.contactCenterId;
export const selectSessionId = (state: RootState) =>
  state.auth.loginResponse?.userSessionInfo?.sessionId;

export const { setLoginResponse, setJwt, clearLoginResponse } = authSlice.actions;
export default authSlice.reducer;
