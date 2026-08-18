import { Box, Typography } from '@exotel-npm-dev/signal-design-system';
import { Lottie } from '@exotel-npm-dev/signal-design-system/lottie';
import { useTranslation } from 'react-i18next';
import loadingAnimation from '@/assets/lottie/loading1.json';

export function HydrateFallback() {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        minHeight: '100vh',
      }}
    >
      <Lottie
        animationData={loadingAnimation}
        loop
        autoplay
        style={{ width: 40, height: 40, marginBottom: 20 }}
      />
      <Typography variant="body1" color="text.secondary">
        {t('loading')}
      </Typography>
    </Box>
  );
}

export default HydrateFallback;
