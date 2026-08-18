import { useState, useEffect } from 'react';
import { Box, Typography } from '@exotel-npm-dev/signal-design-system';
import { useTranslation } from 'react-i18next';
import loginScreenBg from '../../../assets/login-screen-bg.png';
import BrandLogo from '@/shared/components/brandLogo';

const CAROUSEL_KEYS = [
  { title: 'carouselStreamlineTitle', description: 'carouselStreamlineDescription' },
  { title: 'carouselInsightsTitle', description: 'carouselInsightsDescription' },
  { title: 'carouselCollaborationTitle', description: 'carouselCollaborationDescription' },
];

export function LoginLeftPanel() {
  const { t } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_KEYS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentItem = CAROUSEL_KEYS[activeSlide];

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        p: 4,
        backgroundColor: 'custom.loginBgColor',
      }}
    >
      {/* Logo */}
      <Box>
        <BrandLogo />
      </Box>

      {/* Illustration + Carousel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ mb: 4 }}>
          <img
            src={loginScreenBg}
            alt="Customer support illustration"
            style={{ width: '100%', maxWidth: 360, height: 'auto', objectFit: 'contain' }}
          />
        </Box>

        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
            {t(currentItem.title)}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
            {t(currentItem.description)}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {CAROUSEL_KEYS.map((_, index) => (
              <Box
                key={index}
                component="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                sx={{
                  width: index === activeSlide ? 24 : 8,
                  height: 8,
                  borderRadius: index === activeSlide ? '4px' : '50%',
                  border: 'none',
                  backgroundColor: index === activeSlide ? 'custom.carouselDotActive' : 'custom.carouselDotInactive',
                  cursor: 'pointer',
                  p: 0,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
