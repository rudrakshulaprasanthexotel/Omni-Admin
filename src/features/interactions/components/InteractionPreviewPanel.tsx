import { useEffect, useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AudioPlayer,
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from '@exotel-npm-dev/signal-design-system';
import { downloadBlob } from '@/shared/utils/downloadBlob';
import { useAppSelector } from '@/store/hooks';
import { selectInteractions } from '../interactionsSlice';
import { InteractionChannel } from '../types';
import { isPresent } from '../utils/formatInteraction';
import InteractionOverview from './InteractionOverview';

type PreviewTab = 'transcript' | 'overview' | 'timeline';

interface InteractionPreviewPanelProps {
  interactionId: string;
}

const InteractionPreviewPanel = ({ interactionId }: InteractionPreviewPanelProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<PreviewTab>('overview');
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [audioRetry, setAudioRetry] = useState(0);
  const interactions = useAppSelector(selectInteractions);
  const interaction = interactions.find((row) => row.id === interactionId);
  const voiceLogUrl = interaction?.voiceLogUrl;
  const showAudioPlayer =
    interaction?.channel === InteractionChannel.CALL && isPresent(voiceLogUrl);

  useEffect(() => {
    if (!showAudioPlayer || !voiceLogUrl) {
      setAudioSrc(null);
      setAudioLoading(false);
      setAudioFailed(false);
      return;
    }

    let objectUrl: string | undefined;
    let cancelled = false;

    const loadVoiceLog = async () => {
      setAudioSrc(null);
      setAudioLoading(true);
      setAudioFailed(false);
      try {
        const blob = await downloadBlob(import.meta.env.VITE_DATA_ENGINE_API_BASE_PATH +voiceLogUrl);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setAudioSrc(objectUrl);
      } catch {
        if (!cancelled) {
          setAudioFailed(true);
        }
      } finally {
        if (!cancelled) {
          setAudioLoading(false);
        }
      }
    };

    void loadVoiceLog();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [showAudioPlayer, voiceLogUrl, audioRetry]);

  return (
    <Box display="flex" flexDirection="column" gap={3} width="100%">
      {showAudioPlayer ? (
        audioSrc ? (
          <AudioPlayer
            src={audioSrc}
            label={t('rightPanelAudioLabel')}
            downloadFileName={`interaction-${interaction.id}`}
          />
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
            minHeight={120}
          >
            {audioLoading ? (
              <CircularProgress size={24} aria-label={t('loading')} />
            ) : audioFailed ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  {t('rightPanelRecordingLoadError')}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setAudioRetry((count) => count + 1)}
                >
                  {t('rightPanelRecordingRetry')}
                </Button>
              </>
            ) : null}
          </Box>
        )
      ) : null}
      <Tabs
        value={tab}
        onChange={(_: SyntheticEvent, value: string | number) => setTab(value as PreviewTab)}
        tabStyle="button"
        variant="fullWidth"
      >
        <Tab label={t('rightPanelTabTranscript')} value="transcript" />
        <Tab label={t('rightPanelTabOverview')} value="overview" />
        <Tab label={t('rightPanelTabTimeline')} value="timeline" />
      </Tabs>

      {tab === 'overview' && interaction ? (
        <InteractionOverview interaction={interaction} />
      ) : tab !== 'overview' ? (
        <Typography variant="body2" color="text.secondary">
          {tab === 'transcript'
            ? t('rightPanelTranscriptEmpty')
            : t('rightPanelTimelineEmpty')}
        </Typography>
      ) : null}
    </Box>
  );
};

export default InteractionPreviewPanel;
