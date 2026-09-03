import { useEffect, useState } from 'react';
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
  RIGHT_PANEL_TRANSITION_MS,
  RIGHT_PANEL_WIDTH,
  RightPanelActionType,
  type RightPanelAction,
} from '../rightPanel/types';
import InteractionPreviewPanel from '@/features/interactions/components/InteractionPreviewPanel';

const titleForAction = (action: RightPanelAction, t: TFunction) => {
  switch (action.type) {
    case RightPanelActionType.INTERACTION_PREVIEW:
      return t('rightPanelInteractionTitle', { id: action.interaction.id });
    default:
      return '';
  }
};

const RightPanelContent = ({ action }: { action: RightPanelAction }) => {
  switch (action.type) {
    case RightPanelActionType.INTERACTION_PREVIEW:
      return (
        <InteractionPreviewPanel
          key={`${action.interaction.id}:${action.tab ?? ''}`}
          interaction={action.interaction}
          initialTab={action.tab}
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
  const isOpen = action != null;

  const [visibleAction, setVisibleAction] = useState(action);
  if (action != null && action !== visibleAction) {
    setVisibleAction(action);
  }

  useEffect(() => {
    dispatch(closeRightPanel());
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (isOpen || visibleAction == null) return;
    const timer = setTimeout(
      () => setVisibleAction(null),
      RIGHT_PANEL_TRANSITION_MS,
    );
    return () => clearTimeout(timer);
  }, [isOpen, visibleAction]);

  return (
    <Box
      flexShrink={0}
      overflow="hidden"
      sx={{
        width: isOpen ? `${RIGHT_PANEL_WIDTH}px` : 0,
        transition: (theme) =>
          theme.transitions.create('width', {
            duration: RIGHT_PANEL_TRANSITION_MS,
            easing: isOpen
              ? theme.transitions.easing.easeOut
              : theme.transitions.easing.sharp,
          }),
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      {visibleAction != null && (
        <Box
          component="aside"
          aria-label={titleForAction(visibleAction, t)}
          width={RIGHT_PANEL_WIDTH}
          height="100%"
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
              {titleForAction(visibleAction, t)}
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
            <RightPanelContent action={visibleAction} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RightPanel;
