import type { AssignedCampaign, AssignedProcess } from "@/services/apiClient/appServerApis";
import { clearLoginResponse } from "@/features/auth/authSlice";
import { fetchAssignedCampaigns, fetchAssignedProcesses } from "./asyncActions";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

interface ProcessState {
  selectedProcessId: number | null;
  assignedProcesses: AssignedProcess[];
  assignedProcessesLoading: boolean;
  assignedProcessesError: string | null;
  assignedProcessesLoaded: boolean;
  assignedCampaigns: AssignedCampaign[];
  assignedCampaignsLoading: boolean;
  assignedCampaignsError: string | null;
  assignedCampaignsLoaded: boolean;
}

const initialState: ProcessState = {
  selectedProcessId: null,
  assignedProcesses: [],
  assignedProcessesLoading: false,
  assignedProcessesError: null,
  assignedProcessesLoaded: false,
  assignedCampaigns: [],
  assignedCampaignsLoading: false,
  assignedCampaignsError: null,
  assignedCampaignsLoaded: false,
};

const processSlice = createSlice({
  name: 'process',
  initialState,
  reducers: {
    setSelectedProcessId(state, action: PayloadAction<number | null>) {
      state.selectedProcessId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignedProcesses.pending, (state) => {
        state.assignedProcessesLoading = true;
        state.assignedProcessesError = null;
      })
      .addCase(fetchAssignedProcesses.fulfilled, (state, action) => {
        state.assignedProcessesLoading = false;
        state.assignedProcessesLoaded = true;
        state.assignedProcesses = action.payload;
      })
      .addCase(fetchAssignedProcesses.rejected, (state, action) => {
        state.assignedProcessesLoading = false;
        state.assignedProcessesLoaded = true;
        state.assignedProcessesError = action.payload ?? action.error.message ?? null;
      })
      .addCase(fetchAssignedCampaigns.pending, (state) => {
        state.assignedCampaignsLoading = true;
        state.assignedCampaignsError = null;
      })
      .addCase(fetchAssignedCampaigns.fulfilled, (state, action) => {
        state.assignedCampaignsLoading = false;
        state.assignedCampaignsLoaded = true;
        state.assignedCampaigns = action.payload;
      })
      .addCase(fetchAssignedCampaigns.rejected, (state, action) => {
        state.assignedCampaignsLoading = false;
        state.assignedCampaignsLoaded = true;
        state.assignedCampaignsError = action.payload ?? action.error.message ?? null;
      })
      .addCase(clearLoginResponse, () => initialState);
  },
});

export const { setSelectedProcessId } = processSlice.actions;

export const selectSelectedProcessId = (state: RootState) => state.process.selectedProcessId;

export const selectAssignedProcesses = (state: RootState) => state.process.assignedProcesses;
export const selectAssignedProcessesLoading = (state: RootState) =>
  state.process.assignedProcessesLoading;
export const selectAssignedProcessesError = (state: RootState) =>
  state.process.assignedProcessesError;
export const selectAssignedProcessesLoaded = (state: RootState) =>
  state.process.assignedProcessesLoaded;

export const selectAssignedCampaigns = (state: RootState) => state.process.assignedCampaigns;
export const selectAssignedCampaignsLoading = (state: RootState) =>
  state.process.assignedCampaignsLoading;
export const selectAssignedCampaignsError = (state: RootState) =>
  state.process.assignedCampaignsError;
export const selectAssignedCampaignsLoaded = (state: RootState) =>
  state.process.assignedCampaignsLoaded;

export default processSlice.reducer;
