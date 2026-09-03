import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  supervisorApis,
  type AssignedCampaign,
  type AssignedProcess,
} from '@/services/apiClient/supervisorApis';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import type { RootState } from '@/store';

type ThunkConfig = { rejectValue: string; state: RootState };

export const fetchAssignedProcesses = createAsyncThunk<AssignedProcess[], void, ThunkConfig>(
  'process/fetchAssignedProcesses',
  async (_, { getState, rejectWithValue }) => {
    try {
      const sessionId = getState()?.auth?.loginResponse?.userSessionInfo?.sessionId;
      const { data } = await supervisorApis.getAssignedProcesses(sessionId);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to load assigned processes'));
    }
  },
);

export const fetchAssignedCampaigns = createAsyncThunk<AssignedCampaign[], void, ThunkConfig>(
  'process/fetchAssignedCampaigns',
  async (_, { getState, rejectWithValue }) => {
    try {
      const sessionId = getState()?.auth?.loginResponse?.userSessionInfo?.sessionId;
      const { data } = await supervisorApis.getAssignedCampaigns(sessionId);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to load assigned campaigns'));
    }
  },
);
