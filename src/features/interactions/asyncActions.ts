import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import type {
  CallDetailsBean,
  CallDetailsRequestBean,
  FilterContainer,
} from '@/boilerplate/dataEngineApis/models';
import { dataEngineApis } from '@/services/apiClient/dataEngineApis';
import { supervisorApis } from '@/services/apiClient/supervisorApis';
import {
  normaliseAxiosResponse,
  type NormalisedAxiosResponse,
} from '@/shared/utils/normaliseAxiosResponse';
import type { RootState } from '@/store';

export interface FetchInteractionsArgs {
  campaignId: number;
  fromEpochMs?: number;
  toEpochMs?: number;
  pageNumber?: number;
  pageSize?: number;
  searchText?: string;
  sortField?: string;
  sortAsc?: boolean;
}

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

function emptyMultiValueEqualFilters(): { [key: string]: Array<string> } {
  return {
    callType: [],
    status: [],
    disposition: [],
    userIds: [],
    filterGroups: [],
    tableFilters: [],
    queueFilters: [],
    scored_calls: [],
  };
}

function emptyContainFilters(): FilterContainer['containFilters'] {
  return {
    phonenumber: [{ values: [''], searchType: 'CONTAINS' }],
    callNotes: [{ values: [''], searchType: 'CONTAINS' }],
  };
}

function buildSearchRequest(args: FetchInteractionsArgs): CallDetailsRequestBean {
  const now = Date.now();
  const from = args.fromEpochMs ?? now - DEFAULT_LOOKBACK_MS;
  const to = args.toEpochMs ?? now;

  const campaignFilter: FilterContainer = {
    equalFilters: { campaignid: String(args.campaignId) },
    multiValueEqualFilters: emptyMultiValueEqualFilters(),
    containFilters: emptyContainFilters(),
    rangeFilters: {
      date_added: [
        {
          fromValue: String(from),
          toValue: String(to),
          rangeType: 'BOTH_INCLUSIVE',
        },
      ],
    },
  };

  return {
    pageNumber: args.pageNumber ?? 1,
    pageSize: args.pageSize ?? DEFAULT_PAGE_SIZE,
    filters: [campaignFilter],
    searchText: args.searchText?.trim() || undefined,
    sortFields: args.sortField
      ? { [args.sortField]: args.sortAsc ?? false }
      : undefined,
  };
}

function isEmptyResultError(error: AxiosError<{ errorCode?: string }>): boolean {
  return error.response?.status === 404 && error.response?.data?.errorCode === '1001';
}

export const fetchInteractions = createAsyncThunk<
  NormalisedAxiosResponse<CallDetailsBean[]>,
  FetchInteractionsArgs,
  { rejectValue: NormalisedAxiosResponse; state: RootState }
>('interactions/fetchInteractions', async (args, { rejectWithValue }) => {
  try {
    const response = await dataEngineApis.callDetails.getCallDetails(buildSearchRequest(args));
    return normaliseAxiosResponse(response, 'success');
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (isEmptyResultError(error)) {
        return {
          isSuccess: true,
          message: 'No interactions found',
          code: '404',
          response: {
            status: 404,
            statusText: 'Not Found',
            headers: undefined,
            data: [] as CallDetailsBean[],
          },
        };
      }
      return rejectWithValue(normaliseAxiosResponse(error, 'error'));
    }
    return rejectWithValue({
      isSuccess: false,
      message: 'Failed to load interactions',
    });
  }
});

export const fetchCampaignQaDenominator = createAsyncThunk<
  { campaignId: number; total: number },
  { campaignId: number; contactCenterId: number; processId: number },
  { rejectValue: NormalisedAxiosResponse }
>(
  'interactions/fetchCampaignQaDenominator',
  async ({ campaignId, contactCenterId, processId }, { rejectWithValue }) => {
    try {
      const response = await dataEngineApis.callQaParameter.getAllCampaignQAParameterForCampaign(
        campaignId,
        contactCenterId,
        processId,
      );
      const total = response.data.response?.data?.length ?? 0;
      return { campaignId, total };
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(normaliseAxiosResponse(error, 'error'));
      }
      return rejectWithValue({
        isSuccess: false,
        message: 'Failed to load QA parameters',
      });
    }
  },
);

export const fetchAssignedCampaigns = createAsyncThunk<
  NormalisedAxiosResponse<Awaited<ReturnType<typeof supervisorApis.getAssignedCampaigns>>['data']>,
  void,
  { rejectValue: NormalisedAxiosResponse; state: RootState }
>('interactions/fetchAssignedCampaigns', async (_, { getState, rejectWithValue }) => {
  try {
    const sessionId = getState()?.auth?.loginResponse?.userSessionInfo?.sessionId;
    const response = await supervisorApis.getAssignedCampaigns(sessionId);
    return normaliseAxiosResponse(response, 'success');
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return rejectWithValue(normaliseAxiosResponse(error, 'error'));
    }
    return rejectWithValue({
      isSuccess: false,
      message: 'Failed to load campaigns',
    });
  }
});
