import type { Process, TableDefinition } from "@/boilerplate/cmsApis/models";
import type { NormalisedAxiosResponse } from "@/shared/utils/normaliseAxiosResponse";
import { createProcess, getAllTableDefinitions, getProcessList } from "./asyncActions";
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
};

const processSlice = createSlice({
  name: 'process',
  initialState,
  reducers: {
    clearCreateProcessError(state) {
      state.createProcessError = null;
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
      });
  },
});

export const { clearCreateProcessError, setSelectedProcessId } = processSlice.actions;

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

export default processSlice.reducer;
