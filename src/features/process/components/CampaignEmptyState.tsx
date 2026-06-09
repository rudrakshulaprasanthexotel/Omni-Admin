import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Icon,
  Typography,
} from '@exotel-npm-dev/signal-design-system';
import campaignEmptyStateIllustration from '@/assets/illustrations/campaign-empty-state.png';

interface CampaignEmptyStateProps {
  onCreateCampaign: () => void;
}

const CampaignEmptyState = ({ onCreateCampaign }: CampaignEmptyStateProps) => {
  const { t } = useTranslation();

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
        src={campaignEmptyStateIllustration}
        alt={t('campaignEmptyStateAlt')}
        sx={{ width: 265, height: 277, mb: 1 }}
      />

      <Box sx={{ textAlign: 'center', maxWidth: 422 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'neutral.600', mb: 1 }}>
          {t('campaignEmptyStateTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('campaignEmptyStateDescription')}
        </Typography>
      </Box>

      <Button variant="contained" size="medium" color="primary" onClick={onCreateCampaign}>
        {t('campaignEmptyStateCreateButton')}
      </Button>

      <Box
        component="a"
        href="#"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          textDecoration: 'none',
          color: 'primary.main',
        }}
      >
        <Icon name="book-open" size="sm" />
        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
          {t('campaignEmptyStateManagementLink')}
        </Typography>
      </Box>
    </Box>
  );
};

export default CampaignEmptyState;
