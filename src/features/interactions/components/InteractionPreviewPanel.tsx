import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Tab, Tabs, Typography } from '@exotel-npm-dev/signal-design-system';
import { useAppSelector } from '@/store/hooks';
import { selectInteractions } from '../interactionsSlice';
import InteractionOverview from './InteractionOverview';

type PreviewTab = 'transcript' | 'overview' | 'timeline';

interface InteractionPreviewPanelProps {
  interactionId: string;
}

const InteractionPreviewPanel = ({ interactionId }: InteractionPreviewPanelProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<PreviewTab>('overview');
  const interactions = useAppSelector(selectInteractions);
  const interaction = interactions.find((row) => row.id === interactionId);

  return (
    <Box display="flex" flexDirection="column" gap={3} width="100%">
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
