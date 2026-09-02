import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, HoverCard, Icon, Typography } from '@exotel-npm-dev/signal-design-system';

/** 322px of content inside the card's 12px padding. */
const CARD_WIDTH = 348;

const CopilotLogomark = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      width: 20,
      height: 20,
      borderRadius: '5px',
      color: 'common.white',
      background: (theme) => theme.palette.custom.aiIconGradient,
      boxShadow: (theme) => theme.palette.custom.aiIconBoxShadow,
    }}
  >
    <Icon name="sparkle" size={12.5} weight="fill" />
  </Box>
);

interface AiTranscriptPromoProps {
  children: ReactNode;
  onRequestDemo?: () => void;
  onLearnMore?: () => void;
}

/**
 * Hover card shown over the locked Transcript tab on voice interactions,
 * where the transcript itself sits behind the AI add-on.
 */
const AiTranscriptPromo = ({ children, onRequestDemo, onLearnMore }: AiTranscriptPromoProps) => {
  const { t } = useTranslation();

  return (
    <HoverCard
      placement="bottom"
      width={CARD_WIDTH}
      slotProps={{ paper: { sx: { width: CARD_WIDTH } } }}
      content={
        <Box display="flex" flexDirection="column" gap={1.5} p={1.5}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <CopilotLogomark />
              <Typography variant="subtitle1" noWrap>
                {t('rightPanelAiTranscriptTitle')}
              </Typography>
            </Box>
            <Typography variant="body2">{t('rightPanelAiTranscriptDescription')}</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button variant="outlined" size="medium" color="inherit" onClick={onRequestDemo}>
              {t('rightPanelAiTranscriptRequestDemo')}
            </Button>
            <Button variant="text" size="medium" color="inherit" onClick={onLearnMore}>
              {t('rightPanelAiTranscriptLearnMore')}
            </Button>
          </Box>
        </Box>
      }
    >
      {children}
    </HoverCard>
  );
};

export default AiTranscriptPromo;
