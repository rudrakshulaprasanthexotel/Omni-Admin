import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  appServerApis,
  type AssignedCampaign,
  type AssignedProcess,
} from '@/services/apiClient/appServerApis';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import type { RootState } from '@/store';

type ThunkConfig = { rejectValue: string; state: RootState };

export const fetchAssignedProcesses = createAsyncThunk<AssignedProcess[], void, ThunkConfig>(
  'process/fetchAssignedProcesses',
  async (_, { getState, rejectWithValue }) => {
    try {
      const sessionId = getState()?.auth?.loginResponse?.userSessionInfo?.sessionId;
      const { data } = await appServerApis.getAssignedProcesses(sessionId);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to load assigned processes'));
    }
  },
  {
    condition: (_, { getState }) => {
      const { assignedProcessesLoaded, assignedProcessesLoading } = getState().process;
      return !assignedProcessesLoaded && !assignedProcessesLoading;
    },
  },
);

export const fetchAssignedCampaigns = createAsyncThunk<AssignedCampaign[], void, ThunkConfig>(
  'process/fetchAssignedCampaigns',
  async (_, { getState, rejectWithValue }) => {
    try {
      const sessionId = getState()?.auth?.loginResponse?.userSessionInfo?.sessionId;
      const { data } = await appServerApis.getAssignedCampaigns(sessionId);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to load assigned campaigns'));
    }
  },
  {
    condition: (_, { getState }) => {
      const { assignedCampaignsLoaded, assignedCampaignsLoading } = getState().process;
      return !assignedCampaignsLoaded && !assignedCampaignsLoading;
    },
  },
);
