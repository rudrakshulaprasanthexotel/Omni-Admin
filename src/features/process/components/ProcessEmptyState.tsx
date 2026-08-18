import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Divider,
  Icon,
  IconButton,
  Typography,
} from '@exotel-npm-dev/signal-design-system';
import processEmptyStateIllustration from '@/assets/illustrations/process-empty-state.svg';

interface ProcessEmptyStateProps {
  onCreateProcess: () => void;
}

const ProcessEmptyState = ({ onCreateProcess }: ProcessEmptyStateProps) => {
  const { t } = useTranslation();
  const [aiPrompt, setAiPrompt] = useState('');

  const handleAiSubmit = () => {
    const trimmed = aiPrompt.trim();
    if (!trimmed) return;
    // TODO: integrate with AI process creation
    setAiPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiSubmit();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
        px: 3,
      }}
    >
      <Box
        component="img"
        src={processEmptyStateIllustration}
        alt={t('processEmptyStateAlt')}
        sx={{ width: 284, height: 177, mb: 1 }}
      />

      <Box sx={{ textAlign: 'center', maxWidth: 422 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'neutral.600', mb: 1 }}>
          {t('processEmptyStateTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('processEmptyStateDescription')}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
          maxWidth: 482,
          border: 1,
          borderColor: 'primary.main',
          borderRadius: 3,
          px: 1.5,
          py: 1,
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.palette.custom.aiInputBoxShadow,
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '5px',
            flexShrink: 0,
            background: (theme) => theme.palette.custom.aiIconGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: (theme) => theme.palette.custom.aiIconBoxShadow,
          }}
        >
          <Icon name="sparkle" size="xs" />
        </Box>

        <Box
          component="input"
          value={aiPrompt}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('processEmptyStateAiPlaceholder')}
          sx={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 14,
            lineHeight: 1.43,
            letterSpacing: '0.17px',
            bgcolor: 'transparent',
            color: 'text.primary',
            '&::placeholder': {
              color: 'text.disabled',
              opacity: 1,
            },
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <IconButton size="small">
            <Icon name="microphone" size="sm" />
          </IconButton>
          <IconButton
            size="small"
            disabled={!aiPrompt.trim()}
            onClick={handleAiSubmit}
            sx={{
              bgcolor: 'primary.dark',
              color: 'white',
              borderRadius: 2,
              width: 32,
              height: 32,
              '&:hover': { bgcolor: 'primary.main' },
              '&.Mui-disabled': {
                bgcolor: 'primary.dark',
                color: 'white',
                opacity: 0.25,
              },
            }}
          >
            <Icon name="arrow-up" size="sm" />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ width: 42, my: 0.5 }} />

      <Button variant="contained" size="medium" color="primary" onClick={onCreateProcess}>
        {t('processEmptyStateCreateButton')}
      </Button>
    </Box>
  );
};

export default ProcessEmptyState;
