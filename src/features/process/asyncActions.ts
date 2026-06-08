import type { TableDefinition, AddProcessRequest, Process } from '@/boilerplate/cmsApis/models';
import { apiClient } from '@/services/apiClient';
import { cmsApis } from '@/services/apiClient/cmsApis';
import { normaliseAxiosResponse, type NormalisedAxiosResponse } from '@/shared/utils/normaliseAxiosResponse';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

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
