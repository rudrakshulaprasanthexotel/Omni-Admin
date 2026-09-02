export const RightPanelActionType = {
  INTERACTION_PREVIEW: 'interaction-preview',
} as const;

export type RightPanelActionType =
  (typeof RightPanelActionType)[keyof typeof RightPanelActionType];

export type RightPanelAction = {
  type: typeof RightPanelActionType.INTERACTION_PREVIEW;
  interactionId: string;
};

/** Figma right-panel width on Interaction Details (node 558:52897). */
export const RIGHT_PANEL_WIDTH = 419;

export const RIGHT_PANEL_TRANSITION_MS = 225;
