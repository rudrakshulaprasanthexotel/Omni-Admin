import type { Process } from '@/boilerplate/cmsApis/models';
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
