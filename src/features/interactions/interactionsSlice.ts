import { createSelector, createSlice } from '@reduxjs/toolkit';
import type {
  CustomCursorMetadata,
  InteractionOutPutBean,
} from '@/boilerplate/dataEngineApis/models';
import type { NormalisedAxiosResponse } from '@/shared/utils/normaliseAxiosResponse';
import type { RootState } from '@/store';
import {
  extractCursorFromUrl,
  fetchAssignedCampaigns,
  fetchCampaignQaDenominator,
  fetchInteractions,
} from './asyncActions';
import type { AssignedCampaign } from '@/services/apiClient/supervisorApis';
import { mapInteractionOutPutBeanToInteraction } from './utils/mapInteraction';
import type { Interaction } from './types';

interface InteractionsState {
  rows: InteractionOutPutBean[];
  loading: boolean;
  error: NormalisedAxiosResponse | null;

  /**
   * Cursor-based pagination. `beforeCursor` / `afterCursor` are extracted from
   * the response's `metadata.prev_page_url` / `metadata.next_page_url` and
   * threaded back into the next `fetchInteractions` call. `pageIndex` is a
   * client-only bookkeeping value used by the DataGrid pager (0-indexed).
   */
  pageIndex: number;
  pageSize: number;
  beforeCursor: string | null;
  afterCursor: string | null;
  /**
   * Rows returned in this page. Sourced from `metadata.count`.
   */
  currentPageCount: number;
  /**
   * The endpoint's `metadata.total_string` is a *string* (e.g. `"many"`,
   * `"1000+"`, `"27"`). We parse it into an integer when possible; otherwise
   * `-1` signals "unknown" and the pager renders without a total badge. This
   * is a delta on §4 row #16 (real integer total for the "1-9 of 13" pager).
   */
  totalRows: number;
  totalString: string | null;

  campaigns: AssignedCampaign[];
  campaignsLoading: boolean;
  campaignsError: NormalisedAxiosResponse | null;

  qaDenominatorByCampaignId: Record<number, number>;
  qaDenominatorLoading: boolean;
}

const initialState: InteractionsState = {
  rows: [],
  loading: false,
  error: null,
  pageIndex: 0,
  pageSize: 50,
  beforeCursor: null,
  afterCursor: null,
  currentPageCount: 0,
  totalRows: -1,
  totalString: null,
  campaigns: [],
  campaignsLoading: false,
  campaignsError: null,
  qaDenominatorByCampaignId: {},
  qaDenominatorLoading: false,
};

function parseTotal(totalString: string | undefined | null): number {
  if (!totalString) return -1;
  const trimmed = totalString.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'many') return -1;
  // Strip trailing `+` (e.g. "1000+") and any leading "more than " prose.
  const numericPart = trimmed.replace(/^more than\s*/i, '').replace(/\+$/, '');
  const parsed = Number(numericPart);
  return Number.isFinite(parsed) ? parsed : -1;
}

function extractCursors(metadata: CustomCursorMetadata | null): {
  before: string | null;
  after: string | null;
} {
  if (!metadata) return { before: null, after: null };
  return {
    before: extractCursorFromUrl(metadata.prev_page_url, 'before_cursor') ?? null,
    after: extractCursorFromUrl(metadata.next_page_url, 'after_cursor') ?? null,
  };
}

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState,
  reducers: {
    clearInteractions(state) {
      state.rows = [];
      state.error = null;
    },
    /**
     * Resets pagination to page 0 and clears cursors. Called whenever a
     * filter (campaign, search text, etc.) changes.
     */
    resetInteractionsPagination(state) {
      state.rows = [];
      state.pageIndex = 0;
      state.beforeCursor = null;
      state.afterCursor = null;
      state.currentPageCount = 0;
      state.totalRows = -1;
      state.totalString = null;
      state.error = null;
    },
    /**
     * Sets the requested page-index for bookkeeping — the actual paging is
     * driven by cursors, but the DataGrid pager renders numbers from this.
     */
    setInteractionsPageIndex(state, action: { payload: number }) {
      state.pageIndex = Math.max(0, action.payload);
    },
    setInteractionsPageSize(state, action: { payload: number }) {
      state.pageSize = Math.max(1, action.payload);
      state.pageIndex = 0;
      state.beforeCursor = null;
      state.afterCursor = null;
      state.rows = [];
      state.totalRows = -1;
      state.totalString = null;
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
        const payload = action.payload.response?.data;
        const rows = payload?.rows ?? [];
        const metadata = payload?.metadata ?? null;
        const { before, after } = extractCursors(metadata);

        state.rows = rows;
        state.beforeCursor = before;
        state.afterCursor = after;
        state.currentPageCount = metadata?.count ?? rows.length;
        state.totalString = metadata?.total_string ?? null;
        state.totalRows = parseTotal(metadata?.total_string);
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
        state.rows = [];
        state.beforeCursor = null;
        state.afterCursor = null;
        state.currentPageCount = 0;
        state.totalRows = 0;
        state.totalString = null;
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

export const {
  clearInteractions,
  resetInteractionsPagination,
  setInteractionsPageIndex,
  setInteractionsPageSize,
} = interactionsSlice.actions;

export const selectInteractionRows = (state: RootState) => state.interactions.rows;
export const selectInteractionsLoading = (state: RootState) => state.interactions.loading;
export const selectInteractionsError = (state: RootState) => state.interactions.error;
export const selectInteractionsTotalRows = (state: RootState) => state.interactions.totalRows;
export const selectInteractionsTotalString = (state: RootState) =>
  state.interactions.totalString;
export const selectInteractionsPageIndex = (state: RootState) => state.interactions.pageIndex;
export const selectInteractionsPageSize = (state: RootState) => state.interactions.pageSize;
export const selectInteractionsBeforeCursor = (state: RootState) =>
  state.interactions.beforeCursor;
export const selectInteractionsAfterCursor = (state: RootState) =>
  state.interactions.afterCursor;
export const selectInteractionsCurrentPageCount = (state: RootState) =>
  state.interactions.currentPageCount;
export const selectInteractionsCampaigns = (state: RootState) => state.interactions.campaigns;
export const selectInteractionsCampaignsLoading = (state: RootState) =>
  state.interactions.campaignsLoading;
export const selectQaDenominatorByCampaignId = (state: RootState) =>
  state.interactions.qaDenominatorByCampaignId;

export const selectInteractions = createSelector(
  [selectInteractionRows, selectQaDenominatorByCampaignId],
  (rows, qaDenominatorByCampaignId): Interaction[] =>
    rows.map((row) => {
      const raw = row as InteractionOutPutBean & Record<string, unknown>;
      const campaignId =
        (raw.lastCampaignId as number | undefined) ??
        (raw['last_campaign_id'] as number | undefined);
      const qaDenominator =
        typeof campaignId === 'number' ? qaDenominatorByCampaignId[campaignId] ?? null : null;
      return mapInteractionOutPutBeanToInteraction(row, { qaDenominator });
    }),
);

export default interactionsSlice.reducer;
