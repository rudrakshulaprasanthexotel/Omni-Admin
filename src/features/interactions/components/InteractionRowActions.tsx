import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Icon,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  useToast,
} from '@exotel-npm-dev/signal-design-system';
import { useAppDispatch } from '@/store/hooks';
import { openRightPanel } from '@/layouts/rightPanel/rightPanelSlice';
import { RightPanelActionType } from '@/layouts/rightPanel/types';
import { downloadBlob, saveBlobAsFile } from '@/shared/utils/downloadBlob';
import { InteractionChannel, type Interaction } from '../types';
import { isPresent } from '../utils/formatInteraction';

interface InteractionRowActionsProps {
  interaction: Interaction;
}

/** `interaction-42.mp3` — extension taken from the recording URL when it has one. */
const audioFileName = (interactionId: string, voiceLogUrl: string) => {
  const extension = /\.([a-z0-9]{2,4})(?:$|\?)/i.exec(voiceLogUrl)?.[1];
  return `interaction-${interactionId}.${extension ?? 'mp3'}`;
};

const InteractionRowActions = ({ interaction }: InteractionRowActionsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { showError } = useToast();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  const voiceLogUrl = interaction.voiceLogUrl;
  const isVoice = interaction.channel === InteractionChannel.CALL;
  const hasRecording = isPresent(voiceLogUrl);

  const openPreview = () => {
    dispatch(
      openRightPanel({
        type: RightPanelActionType.INTERACTION_PREVIEW,
        interactionId: interaction.id,
      }),
    );
  };

  const handlePlay = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    openPreview();
  };

  const handleMoreClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const closeMenu = () => setMenuAnchor(null);

  const handleViewDetails = () => {
    closeMenu();
    openPreview();
  };

  const handleDownloadAudio = async () => {
    closeMenu();
    if (!voiceLogUrl) return;
    setDownloading(true);
    try {
      const blob = await downloadBlob(
        import.meta.env.VITE_DATA_ENGINE_API_BASE_PATH + voiceLogUrl,
      );
      saveBlobAsFile(blob, audioFileName(interaction.id, voiceLogUrl));
    } catch {
      showError(t('interactionsDownloadAudioError'));
    } finally {
      setDownloading(false);
    }
  };

  const downloadItem = (
    <MenuItem
      disabled={!hasRecording || downloading}
      onClick={() => void handleDownloadAudio()}
    >
      <ListItemIcon>
        <Icon name="download" size="sm" />
      </ListItemIcon>
      <ListItemText primary={t('interactionsDownloadAudio')} />
    </MenuItem>
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
      <IconButton
        size="small"
        variant="outlined"
        aria-label={t('interactionsPlayAction')}
        onClick={handlePlay}
      >
        <Icon name="play-circle" />
      </IconButton>
      <IconButton
        size="small"
        variant="outlined"
        aria-label={t('interactionsMoreActions')}
        aria-haspopup="menu"
        aria-expanded={menuAnchor !== null}
        onClick={handleMoreClick}
      >
        <Icon name="dots-three-vertical" />
      </IconButton>
      <Menu
        open={menuAnchor !== null}
        anchorEl={menuAnchor}
        onClose={closeMenu}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <Icon name="note-pencil" size="sm" />
          </ListItemIcon>
          <ListItemText primary={t('interactionsViewDetails')} />
        </MenuItem>
        {isVoice ? (
          hasRecording ? (
            downloadItem
          ) : (
            <Tooltip title={t('interactionsDownloadAudioUnavailable')} placement="left">
              <span>{downloadItem}</span>
            </Tooltip>
          )
        ) : null}
      </Menu>
    </Box>
  );
};

export default InteractionRowActions;
