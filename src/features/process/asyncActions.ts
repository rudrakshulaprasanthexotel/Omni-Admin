import type { TableDefinition, AddProcessRequest, Process } from '@/boilerplate/cmsApis/models';
import { apiClient } from '@/services/apiClient';
import { cmsApis } from '@/services/apiClient/cmsApis';
import { normaliseAxiosError, type NormalisedAxiosError } from '@/shared/utils/normaliseAxiosError';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

export const getProcessList = createAsyncThunk<Process[], number, { rejectValue: NormalisedAxiosError }>(
  'process/getAllProcessesInContactCenter',
  async (contactCenterId: number, { rejectWithValue }) => {
    try {
      const response = await cmsApis.contactCenter.getAllProcessInContactCenter(contactCenterId);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosError(error));
      }
      return rejectWithValue({
        message: 'Failed to get process list',
      });
    };
  }
);

export const createProcess = createAsyncThunk<Process, AddProcessRequest, { rejectValue: NormalisedAxiosError }>(
  'process/addProcess',
  async (request: AddProcessRequest, { rejectWithValue }) => {
    try {
      const response = await cmsApis.process.addProcess(request);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosError(error));
      }
      return rejectWithValue({
        message: 'Failed to create process',
      });
    }
  }
);

export const getAllTableDefinitions = createAsyncThunk<TableDefinition[], void, { rejectValue: NormalisedAxiosError }>(
  'process/getAllTableDefinitions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<TableDefinition[]>(
        '/ameyorestapi/cc/tableDefinitions/getAllTableDefinition'
      )
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosError(error));
      }
      return rejectWithValue({
        message: 'Failed to get table definitions',
      });
    }
  }
);
