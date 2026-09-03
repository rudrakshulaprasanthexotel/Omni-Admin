import type { TableDefinition, AddProcessRequest, Process, Campaign, AddCampaignRequest } from '@/boilerplate/cmsApis/models';
import { apiClient } from '@/services/apiClient';
import { cmsApis } from '@/services/apiClient/cmsApis';
import { supervisorApis } from '@/services/apiClient/supervisorApis';
import { normaliseAxiosResponse, type NormalisedAxiosResponse } from '@/shared/utils/normaliseAxiosResponse';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import type { RootState } from '@/store';

export const getProcessList = createAsyncThunk<NormalisedAxiosResponse<Process[]>, number, { rejectValue: NormalisedAxiosResponse }>(
  'process/getAllProcessesInContactCenter',
  async (contactCenterId: number, { rejectWithValue }) => {
    try {
      const response = await cmsApis.contactCenter.getAllProcessInContactCenter(contactCenterId);
      return normaliseAxiosResponse(response, 'success');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: 'Failed to get process list',
      });
    };
  }
);

export const createProcess = createAsyncThunk<NormalisedAxiosResponse<Process>, AddProcessRequest, { rejectValue: NormalisedAxiosResponse }>(
  'process/addProcess',
  async (request: AddProcessRequest, { rejectWithValue }) => {
    try {
      const response = await cmsApis.process.addProcess(request);
      return normaliseAxiosResponse(response, 'success');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: 'Failed to create process',
      });
    }
  }
);

export const createCampaign = createAsyncThunk<NormalisedAxiosResponse<Campaign>, AddCampaignRequest, { rejectValue: NormalisedAxiosResponse }>(
  'process/addCampaign',
  async (request: AddCampaignRequest, { rejectWithValue }) => {
    try {
      const response = await cmsApis.campaign.addCampaign(request);
      return normaliseAxiosResponse(response, 'success');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: 'Failed to create campaign',
      });
    }
  }
);

export const getCampaignList = createAsyncThunk<NormalisedAxiosResponse<Campaign[]>, number, { rejectValue: NormalisedAxiosResponse }>(
  'process/getCampaignList',
  async (processId: number, { rejectWithValue }) => {
    try {
      const response = await cmsApis.process.getAllCampaignsInProcess(processId);
      return normaliseAxiosResponse(response, 'success');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: 'Failed to get campaign list',
      });
    }
  }
);

export const fetchAssignedProcesses = createAsyncThunk<
  NormalisedAxiosResponse<Awaited<ReturnType<typeof supervisorApis.getAssignedProcesses>>['data']>,
  void,
  { rejectValue: NormalisedAxiosResponse; state: RootState }
>('process/fetchAssignedProcesses', async (_, { getState, rejectWithValue }) => {
  try {
    const sessionId = getState()?.auth?.loginResponse?.userSessionInfo?.sessionId;
    const response = await supervisorApis.getAssignedProcesses(sessionId);
    return normaliseAxiosResponse(response, 'success');
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return rejectWithValue(normaliseAxiosResponse(error, 'error'));
    }
    return rejectWithValue({
      isSuccess: false,
      message: 'Failed to load assigned processes',
    });
  }
});

export const getAllTableDefinitions = createAsyncThunk<NormalisedAxiosResponse<TableDefinition[]>, void, { rejectValue: NormalisedAxiosResponse }>(
  'process/getAllTableDefinitions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<TableDefinition[]>(
        '/ameyorestapi/cc/tableDefinitions/getAllTableDefinition'
      )
      return normaliseAxiosResponse(response, 'success');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: 'Failed to get table definitions',
      });
    }
  }
);
