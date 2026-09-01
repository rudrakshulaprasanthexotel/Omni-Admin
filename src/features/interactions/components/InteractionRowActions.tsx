import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Icon, IconButton } from '@exotel-npm-dev/signal-design-system';
import { useAppDispatch } from '@/store/hooks';
import { openRightPanel } from '@/layouts/rightPanel/rightPanelSlice';
import { RightPanelActionType } from '@/layouts/rightPanel/types';
import type { Interaction } from '../types';

interface InteractionRowActionsProps {
  interaction: Interaction;
}

const InteractionRowActions = ({ interaction }: InteractionRowActionsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const handlePlay = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    dispatch(
      openRightPanel({
        type: RightPanelActionType.INTERACTION_PREVIEW,
        interactionId: interaction.id,
      }),
    );
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <IconButton
        size="small"
        variant="outlined"
        aria-label={t('interactionsPlayAction')}
        onClick={handlePlay}
      >
        <Icon name="play-circle" />
      </IconButton>
    </Box>
  );
};

export default InteractionRowActions;
