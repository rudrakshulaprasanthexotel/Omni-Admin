import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Timeline from '@mui/lab/Timeline';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from '@mui/lab/TimelineOppositeContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import { Box, Button, Skeleton, Typography } from '@exotel-npm-dev/signal-design-system';
import { interactionApis } from '@/services/apiClient/interactionApis';
import {
  mapInteractionTimelineResponse,
  type InteractionTimelineEvent,
} from '../utils/mapTimeline';

interface InteractionTimelineProps {
  ccId: number;
  processId: number;
  interactionId: string;
}

const TIMELINE_SX = {
  px: 0,
  my: 0,
  [`& .${timelineOppositeContentClasses.root}`]: {
    flex: '0 0 auto',
    pr: 1,
  },
} as const;

function timelineCopyKey(eventName: string, part: 'Title' | 'Description') {
  const camel = eventName
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return `timelineEvent${camel}${part}`;
}

const TimelineSkeletonItem = ({ isLast = false }: { isLast?: boolean }) => (
  <TimelineItem sx={{ minHeight: 'auto' }}>
    <TimelineOppositeContent sx={{ whiteSpace: 'nowrap', textAlign: 'right', pr: 1 }}>
      <Skeleton width={75} height={14} />
    </TimelineOppositeContent>
    <TimelineSeparator sx={{ alignSelf: 'stretch' }}>
      <TimelineDot
        sx={{
          width: 14,
          height: 14,
          my: 1,
          boxShadow: 'none',
          bgcolor: 'transparent',
        }}
      >
        <Skeleton variant="circular" width={14} height={14} />
      </TimelineDot>
      {isLast ? null : <TimelineConnector sx={{ flexGrow: 1 }} />}
    </TimelineSeparator>
    <TimelineContent sx={{ pl: 1 }}>
      <Skeleton width={120} height={20} />
      <Skeleton width={160} height={16} />
    </TimelineContent>
  </TimelineItem>
);

const InteractionTimelineSkeleton = ({ itemCount = 4 }: { itemCount?: number }) => (
  <Box overflow="auto">
    <Timeline position="right" sx={TIMELINE_SX}>
      {Array.from({ length: itemCount }, (_, index) => (
        <TimelineSkeletonItem key={index} isLast={index === itemCount - 1} />
      ))}
    </Timeline>
  </Box>
);

const InteractionTimeline = ({
  ccId,
  processId,
  interactionId,
}: InteractionTimelineProps) => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<InteractionTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadTimeline = async () => {
      setLoading(true);
      setFailed(false);
      try {
        const response = await interactionApis.getInteractionTimeline(
          ccId,
          processId,
          interactionId,
        );
        if (cancelled) return;
        setEvents(mapInteractionTimelineResponse(response.data));
      } catch {
        if (!cancelled) {
          setEvents([]);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [ccId, processId, interactionId, retry]);

  if (loading) {
    return <InteractionTimelineSkeleton />;
  }

  if (failed) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" gap={1} minHeight={120}>
        <Typography variant="label2" color="text.secondary">
          {t('rightPanelTimelineLoadError')}
        </Typography>
        <Button size="small" variant="text" onClick={() => setRetry((count) => count + 1)}>
          {t('rightPanelRecordingRetry')}
        </Button>
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={120}>
        <Typography variant="label2" color="text.secondary">
          {t('rightPanelTimelineEmpty')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      overflow="auto"
      pb={1.5}
      sx={{
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          width: 8,
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'divider',
          borderRadius: 1,
        },
      }}
    >
      <Timeline position="right" sx={{ ...TIMELINE_SX, pb: 4, height: '100%' }}>
        {events.map((event, index) => {
          const title = t(timelineCopyKey(event.eventName, 'Title'), {
            defaultValue: event.title,
          });
          const description = t(timelineCopyKey(event.eventName, 'Description'), {
            defaultValue: event.description,
          });

          return (
            <TimelineItem key={event.id} sx={{ minHeight: 64 }}>
              <TimelineOppositeContent
                sx={{
                  overflow: 'visible',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                  pr: 1,
                  pt: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  component="span"
                  color="text.secondary"
                  sx={{ fontSize: 11, lineHeight: 1.2, fontWeight: 400 }}
                >
                  {event.timestamp}
                </Typography>
              </TimelineOppositeContent>
              <TimelineSeparator sx={{ alignSelf: 'stretch' }}>
                <TimelineDot
                  sx={{
                    width: 14,
                    height: 14,
                    mt: 0.5,
                    mb: 0.5,
                    boxShadow: 'none',
                    bgcolor: 'primary.main',
                  }}
                />
                {index < events.length - 1 ? (
                  <TimelineConnector sx={{ flexGrow: 1, bgcolor: 'primary.main' }} />
                ) : null}
              </TimelineSeparator>
              <TimelineContent sx={{ pl: 1, pt: 0, pb: 1.5 }}>
                {title ? (
                  <Typography variant="label2" component="div" fontWeight={600} color="text.primary">
                    {title}
                  </Typography>
                ) : null}
                {description ? (
                  <Typography variant="body3" component="div" color="text.secondary">
                    {description}
                  </Typography>
                ) : null}
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </Box>
  );
};

export default InteractionTimeline;
