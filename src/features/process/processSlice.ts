import type { Process } from "@/boilerplate/cmsApis/models";
import type { NormalisedAxiosError } from "@/shared/utils/normaliseAxiosError";
import { getProcessList } from "./asyncActions";
import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";


interface ProcessState {
    processList: Process[];
    getProcessListLoading: boolean;
    getProcessListError: NormalisedAxiosError | null;
}

const initialState: ProcessState = {
  processList: [],
  getProcessListLoading: false,
  getProcessListError: null,
};

const processSlice = createSlice({
  name: 'process',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getProcessList.pending, (state) => {
        state.getProcessListLoading = true;
        state.getProcessListError = null;
      })
      .addCase(getProcessList.fulfilled, (state, action) => {
        state.getProcessListLoading = false;
        state.processList = action.payload;
      })
      .addCase(getProcessList.rejected, (state, action) => {
        state.getProcessListLoading = false;
        state.getProcessListError = action.payload;
      })
  }
});

export const selectProcessList = (state: RootState) => state.process.processList;

export default processSlice.reducer;
