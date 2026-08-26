import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { NormalisedAxiosResponse } from '@/shared/utils/normaliseAxiosResponse';
import type { RootState } from '@/store';
import {
  fetchAssignedCampaigns,
  fetchCampaignQaDenominator,
  fetchInteractions,
} from './asyncActions';
import type { AssignedCampaign } from '@/services/apiClient/supervisorApis';
import type { CallDetailsBean } from '@/boilerplate/dataEngineApis/models';
import { mapCallDetailsToInteraction } from './utils/mapCallDetails';
import type { Interaction } from './types';

interface InteractionsState {
  rows: CallDetailsBean[];
  loading: boolean;
  error: NormalisedAxiosResponse | null;

  campaigns: AssignedCampaign[];
  campaignsLoading: boolean;
  campaignsError: NormalisedAxiosResponse | null;

  /** `campaignId -> QA denominator`, cached across page loads. */
  qaDenominatorByCampaignId: Record<number, number>;
  qaDenominatorLoading: boolean;
}

const initialState: InteractionsState = {
  rows: [],
  loading: false,
  error: null,
  campaigns: [],
  campaignsLoading: false,
  campaignsError: null,
  qaDenominatorByCampaignId: {},
  qaDenominatorLoading: false,
};

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState,
  reducers: {
    clearInteractions(state) {
      state.rows = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.response?.data ?? [];
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
        state.rows = [];
      })
      .addCase(fetchAssignedCampaigns.pending, (state) => {
        state.campaignsLoading = true;
        state.campaignsError = null;
      })
      .addCase(fetchAssignedCampaigns.fulfilled, (state, action) => {
        state.campaignsLoading = false;
        state.campaigns = action.payload.response?.data ?? [];
      })
      .addCase(fetchAssignedCampaigns.rejected, (state, action) => {
        state.campaignsLoading = false;
        state.campaignsError = action.payload ?? null;
      })
      .addCase(fetchCampaignQaDenominator.pending, (state) => {
        state.qaDenominatorLoading = true;
      })
      .addCase(fetchCampaignQaDenominator.fulfilled, (state, action) => {
        state.qaDenominatorLoading = false;
        state.qaDenominatorByCampaignId[action.payload.campaignId] = action.payload.total;
      })
      .addCase(fetchCampaignQaDenominator.rejected, (state) => {
        state.qaDenominatorLoading = false;
      });
  },
});

export const { clearInteractions } = interactionsSlice.actions;

export const selectInteractionRows = (state: RootState) => state.interactions.rows;
export const selectInteractionsLoading = (state: RootState) => state.interactions.loading;
export const selectInteractionsError = (state: RootState) => state.interactions.error;
export const selectInteractionsCampaigns = (state: RootState) => state.interactions.campaigns;
export const selectQaDenominatorByCampaignId = (state: RootState) =>
  state.interactions.qaDenominatorByCampaignId;

const selectCampaignNameById = createSelector(
  [selectInteractionsCampaigns],
  (campaigns): Record<string, string> =>
    Object.fromEntries(campaigns.map((c) => [String(c.campaignId), c.campaignName])),
);

/**
 * Presentational selector — memoises the CallDetailsBean → Interaction
 * mapping and cross-joins campaign names + QA denominator so the page can
 * consume `Interaction[]` directly.
 */
export const selectInteractions = createSelector(
  [
    selectInteractionRows,
    selectCampaignNameById,
    selectQaDenominatorByCampaignId,
  ],
  (rows, campaignNameById, qaDenominatorByCampaignId): Interaction[] =>
    rows.map((row) => {
      const campaignKey = row.campaignId ?? '';
      const numericCampaignId = Number(campaignKey);
      const qaDenominator = Number.isFinite(numericCampaignId)
        ? qaDenominatorByCampaignId[numericCampaignId] ?? null
        : null;
      return mapCallDetailsToInteraction(row, {
        campaignNameById,
        qaDenominator,
      });
    }),
);

export default interactionsSlice.reducer;
