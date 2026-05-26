import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "@/services/apiClient";
import type { ILoginRequestInputBean, LoginResponse } from "./types";

export const login = createAsyncThunk<LoginResponse, ILoginRequestInputBean>(
  "auth/login",
  async (input, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        "/ameyorestapi/userLogin/login",
        input,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Login failed",
      );
    }
  },
);
