import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import type { RightPanelAction } from './types';

interface RightPanelState {
  action: RightPanelAction | null;
}

const initialState: RightPanelState = {
  action: null,
};

const rightPanelSlice = createSlice({
  name: 'rightPanel',
  initialState,
  reducers: {
    openRightPanel(state, action: PayloadAction<RightPanelAction>) {
      state.action = action.payload;
    },
    closeRightPanel(state) {
      state.action = null;
    },
  },
});

export const { openRightPanel, closeRightPanel } = rightPanelSlice.actions;

export const selectRightPanelAction = (state: RootState) => state.rightPanel.action;
export const selectRightPanelOpen = (state: RootState) => state.rightPanel.action != null;

export default rightPanelSlice.reducer;
