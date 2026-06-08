import type { Process } from "@/boilerplate/cmsApis/models";
import type { NormalisedAxiosResponse } from "@/shared/utils/normaliseAxiosResponse";
import { createProcess, getProcessList } from "./asyncActions";
import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

interface ProcessState {
  processList: Process[];
  getProcessListLoading: boolean;
  getProcessListError: NormalisedAxiosResponse | null;
  createProcessLoading: boolean;
  createProcessError: NormalisedAxiosResponse | null;
}

const initialState: ProcessState = {
  processList: [],
  getProcessListLoading: false,
  getProcessListError: null,
  createProcessLoading: false,
  createProcessError: null,
};

const processSlice = createSlice({
  name: 'process',
  initialState,
  reducers: {
    clearCreateProcessError(state) {
      state.createProcessError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProcessList.pending, (state) => {
        state.getProcessListLoading = true;
        state.getProcessListError = null;
      })
      .addCase(getProcessList.fulfilled, (state, action) => {
        state.getProcessListLoading = false;
        state.processList = action.payload.response?.data ?? [];
      })
      .addCase(getProcessList.rejected, (state, action) => {
        state.getProcessListLoading = false;
        state.getProcessListError = action.payload ?? null;
      })
      .addCase(createProcess.pending, (state) => {
        state.createProcessLoading = true;
        state.createProcessError = null;
      })
      .addCase(createProcess.fulfilled, (state, action) => {
        state.createProcessLoading = false;
        if (action.payload.response?.data) {
          state.processList.push(action.payload.response.data);
        }
      })
      .addCase(createProcess.rejected, (state, action) => {
        state.createProcessLoading = false;
        state.createProcessError = action.payload ?? null;
      });
  },
});

export const { clearCreateProcessError } = processSlice.actions;

export const selectProcessList = (state: RootState) => state.process.processList;
export const selectCreateProcessLoading = (state: RootState) => state.process.createProcessLoading;
export const selectCreateProcessError = (state: RootState) => state.process.createProcessError;

export default processSlice.reducer;
