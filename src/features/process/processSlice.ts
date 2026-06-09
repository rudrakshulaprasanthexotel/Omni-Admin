import type { Campaign, Process, TableDefinition } from "@/boilerplate/cmsApis/models";
import type { NormalisedAxiosResponse } from "@/shared/utils/normaliseAxiosResponse";
import { createCampaign, createProcess, getAllTableDefinitions, getProcessList } from "./asyncActions";
import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

interface ProcessState {
  processList: Process[];
  getProcessListLoading: boolean;
  getProcessListError: NormalisedAxiosResponse | null;
  selectedProcessId: number | null;
  createProcessLoading: boolean;
  createProcessError: NormalisedAxiosResponse | null;
  tableDefinitions: TableDefinition[];
  getTableDefinitionsLoading: boolean;
  getTableDefinitionsError: NormalisedAxiosResponse | null;
  campaignList: Campaign[];
  createCampaignLoading: boolean;
  createCampaignError: NormalisedAxiosResponse | null;
}

const initialState: ProcessState = {
  processList: [],
  getProcessListLoading: false,
  getProcessListError: null,
  selectedProcessId: null,
  createProcessLoading: false,
  createProcessError: null,
  tableDefinitions: [],
  getTableDefinitionsLoading: false,
  getTableDefinitionsError: null,
  campaignList: [],
  createCampaignLoading: false,
  createCampaignError: null,
};

const processSlice = createSlice({
  name: 'process',
  initialState,
  reducers: {
    clearCreateProcessError(state) {
      state.createProcessError = null;
    },
    clearCreateCampaignError(state) {
      state.createCampaignError = null;
    },
    setSelectedProcessId(state, action: { payload: number | null }) {
      state.selectedProcessId = action.payload;
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
        if (state.selectedProcessId === null && state.processList.length > 0) {
          state.selectedProcessId = state.processList[0].processId ?? null;
        }
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
        const created = action.payload.response?.data;
        if (created) {
          state.processList.push(created);
          state.selectedProcessId = created.processId ?? state.selectedProcessId;
        }
      })
      .addCase(createProcess.rejected, (state, action) => {
        state.createProcessLoading = false;
        state.createProcessError = action.payload ?? null;
      })
      .addCase(getAllTableDefinitions.pending, (state) => {
        state.getTableDefinitionsLoading = true;
        state.getTableDefinitionsError = null;
      })
      .addCase(getAllTableDefinitions.fulfilled, (state, action) => {
        state.getTableDefinitionsLoading = false;
        state.tableDefinitions = action.payload.response?.data ?? [];
      })
      .addCase(getAllTableDefinitions.rejected, (state, action) => {
        state.getTableDefinitionsLoading = false;
        state.getTableDefinitionsError = action.payload ?? null;
      })
      .addCase(createCampaign.pending, (state) => {
        state.createCampaignLoading = true;
        state.createCampaignError = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.createCampaignLoading = false;
        const created = action.payload.response?.data;
        if (created) {
          state.campaignList.push(created);
        }
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.createCampaignLoading = false;
        state.createCampaignError = action.payload ?? null;
      });
  },
});

export const { clearCreateProcessError, clearCreateCampaignError, setSelectedProcessId } = processSlice.actions;

export const selectProcessList = (state: RootState) => state.process.processList;
export const selectSelectedProcessId = (state: RootState) => state.process.selectedProcessId;
export const selectSelectedProcess = (state: RootState) =>
  state.process.processList.find((p) => p.processId === state.process.selectedProcessId) ?? null;
export const selectGetProcessListLoading = (state: RootState) => state.process.getProcessListLoading;
export const selectCreateProcessLoading = (state: RootState) => state.process.createProcessLoading;
export const selectCreateProcessError = (state: RootState) => state.process.createProcessError;
export const selectTableDefinitions = (state: RootState) => state.process.tableDefinitions;
export const selectGetTableDefinitionsLoading = (state: RootState) => state.process.getTableDefinitionsLoading;
export const selectGetTableDefinitionsError = (state: RootState) => state.process.getTableDefinitionsError;

export const selectCampaignList = (state: RootState) => state.process.campaignList;
export const selectCreateCampaignLoading = (state: RootState) => state.process.createCampaignLoading;
export const selectCreateCampaignError = (state: RootState) => state.process.createCampaignError;

export default processSlice.reducer;
