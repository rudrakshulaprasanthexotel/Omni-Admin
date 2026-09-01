import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useLocation } from 'react-router-dom';
import { Box, Icon, IconButton, Typography } from '@exotel-npm-dev/signal-design-system';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  closeRightPanel,
  selectRightPanelAction,
} from '../rightPanel/rightPanelSlice';
import {
  RIGHT_PANEL_WIDTH,
  RightPanelActionType,
  type RightPanelAction,
} from '../rightPanel/types';
import InteractionPreviewPanel from '@/features/interactions/components/InteractionPreviewPanel';

const titleForAction = (action: RightPanelAction, t: TFunction) => {
  switch (action.type) {
    case RightPanelActionType.INTERACTION_PREVIEW:
      return t('rightPanelInteractionTitle', { id: action.interactionId });
    default:
      return '';
  }
};

const RightPanelContent = ({ action }: { action: RightPanelAction }) => {
  switch (action.type) {
    case RightPanelActionType.INTERACTION_PREVIEW:
      return (
        <InteractionPreviewPanel
          key={action.interactionId}
          interactionId={action.interactionId}
        />
      );
    default:
      return null;
  }
};

const RightPanel = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const action = useAppSelector(selectRightPanelAction);

  useEffect(() => {
    dispatch(closeRightPanel());
  }, [location.pathname, dispatch]);

  if (action == null) return null;

  return (
    <Box
      component="aside"
      aria-label={titleForAction(action, t)}
      width={RIGHT_PANEL_WIDTH}
      flexShrink={0}
      display="flex"
      flexDirection="column"
      minHeight={0}
      bgcolor="surface.elevation1"
      borderLeft={1}
      borderColor="divider"
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        py={1.75}
      >
        <Typography variant="subtitle2" fontWeight={600} noWrap>
          {titleForAction(action, t)}
        </Typography>
        <IconButton
          size="small"
          aria-label={t('rightPanelClose')}
          onClick={() => dispatch(closeRightPanel())}
        >
          <Icon name="x" size="sm" />
        </IconButton>
      </Box>
      <Box flex={1} minHeight={0} px={2} pb={2} overflow="auto">
        <RightPanelContent action={action} />
      </Box>
    </Box>
  );
};

export default RightPanel;
