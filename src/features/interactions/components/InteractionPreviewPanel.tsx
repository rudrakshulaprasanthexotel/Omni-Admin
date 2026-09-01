import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  AudioPlayer,
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from '@exotel-npm-dev/signal-design-system';
import { selectContactCenterId } from '@/features/auth/authSlice';
import { downloadBlob } from '@/shared/utils/downloadBlob';
import { useAppSelector } from '@/store/hooks';
import { selectInteractionRows, selectQaDenominatorByCampaignId } from '../interactionsSlice';
import { InteractionChannel } from '../types';
import { isPresent } from '../utils/formatInteraction';
import { mapChatTranscript, type ChatTranscriptMessage } from '../utils/mapChatTranscript';
import { mapInteractionRows } from '../utils/mapInteraction';
import InteractionChatTranscript from './InteractionChatTranscript';
import InteractionOverview from './InteractionOverview';
import InteractionTimeline from './InteractionTimeline';

type PreviewTab = 'transcript' | 'overview' | 'timeline';

interface InteractionPreviewPanelProps {
  interactionId: string;
}

const InteractionPreviewPanel = ({ interactionId }: InteractionPreviewPanelProps) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const interactionRows = useAppSelector(selectInteractionRows);
  const qaDenominatorByCampaignId = useAppSelector(selectQaDenominatorByCampaignId);
  const sessionCcId = useAppSelector(selectContactCenterId);
  const interaction = useMemo(
    () =>
      mapInteractionRows(interactionRows, qaDenominatorByCampaignId).find(
        (row) => row.id === interactionId,
      ),
    [interactionRows, qaDenominatorByCampaignId, interactionId],
  );
  const [tab, setTab] = useState<PreviewTab>(
    interaction?.channel === InteractionChannel.CHAT ? 'transcript' : 'overview',
  );
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [audioRetry, setAudioRetry] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatTranscriptMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFailed, setChatFailed] = useState(false);
  const [chatRetry, setChatRetry] = useState(0);
  const processIdFromUrl = Number(searchParams.get('processId'));
  const ccId = interaction?.contactCenterId ?? sessionCcId;
  const processId =
    interaction?.processId ??
    (Number.isFinite(processIdFromUrl) ? processIdFromUrl : undefined);
  const voiceLogUrl = interaction?.voiceLogUrl;
  const chatTranscriptUrl = interaction?.chatTranscriptUrl;
  const customerName = interaction?.customer.name;
  const userName = interaction?.user.name;
  const dataEngineBasePath = import.meta.env.VITE_DATA_ENGINE_API_BASE_PATH;
  const showAudioPlayer =
    interaction?.channel === InteractionChannel.CALL && isPresent(voiceLogUrl);
  const showChatTranscript = isPresent(chatTranscriptUrl);

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
        const blob = await downloadBlob(dataEngineBasePath + voiceLogUrl);
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
  }, [showAudioPlayer, voiceLogUrl, audioRetry, dataEngineBasePath]);

  useEffect(() => {
    if (!showChatTranscript || !chatTranscriptUrl) {
      setChatMessages([]);
      setChatLoading(false);
      setChatFailed(false);
      return;
    }

    let cancelled = false;

    const loadChatTranscript = async () => {
      setChatMessages([]);
      setChatLoading(true);
      setChatFailed(false);
      try {
        const blob = await downloadBlob(dataEngineBasePath + chatTranscriptUrl);
        if (cancelled) return;
        const text = await blob.text();
        if (cancelled) return;
        setChatMessages(mapChatTranscript(text, { customerName, userName }));
      } catch {
        if (!cancelled) {
          setChatFailed(true);
        }
      } finally {
        if (!cancelled) {
          setChatLoading(false);
        }
      }
    };

    void loadChatTranscript();

    return () => {
      cancelled = true;
    };
  }, [
    showChatTranscript,
    chatTranscriptUrl,
    chatRetry,
    dataEngineBasePath,
    customerName,
    userName,
  ]);

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

      {tab === 'overview' ? (
        interaction ? <InteractionOverview interaction={interaction} /> : null
      ) : tab === 'timeline' ? (
        ccId != null && processId != null ? (
          <InteractionTimeline
            ccId={ccId}
            processId={processId}
            interactionId={interactionId}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('rightPanelTimelineEmpty')}
          </Typography>
        )
      ) : chatLoading ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={120}>
          <CircularProgress size={24} aria-label={t('loading')} />
        </Box>
      ) : chatFailed ? (
        <Box display="flex" alignItems="center" justifyContent="center" gap={1} minHeight={120}>
          <Typography variant="body2" color="text.secondary">
            {t('rightPanelTranscriptLoadError')}
          </Typography>
          <Button size="small" variant="text" onClick={() => setChatRetry((count) => count + 1)}>
            {t('rightPanelRecordingRetry')}
          </Button>
        </Box>
      ) : interaction && chatMessages.length > 0 ? (
        <InteractionChatTranscript messages={chatMessages} interaction={interaction} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('rightPanelTranscriptEmpty')}
        </Typography>
      )}
    </Box>
  );
};

export default InteractionPreviewPanel;
