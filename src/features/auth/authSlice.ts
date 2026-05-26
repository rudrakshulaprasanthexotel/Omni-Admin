import { createSlice } from "@reduxjs/toolkit";
import type { LoginResponse } from "./types";
import { login } from "./asyncActions";

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
      })
      .addCase(login.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload as string;
      });
  },
});

export const { clearLoginResponse } = authSlice.actions;
export default authSlice.reducer;
