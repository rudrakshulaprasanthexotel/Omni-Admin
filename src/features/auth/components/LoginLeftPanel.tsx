import { useState, useEffect } from 'react';
import { Box, Typography } from '@exotel-npm-dev/signal-design-system';
import loginScreenBg from '../../../assets/login-screen-bg.png';

const LOGO = 'https://ik.imagekit.io/kx5hycpnh/LogoExpanded.svg?updatedAt=1763974367162';

const CAROUSEL_ITEMS = [
  {
    title: 'Streamline Your Workflow',
    description: 'Efficiently manage all your customer interactions in one place',
  },
  {
    title: 'Real-Time Insights',
    description: 'Monitor agent performance and queue metrics as they happen',
  },
  {
    title: 'Seamless Collaboration',
    description: 'Connect teams across channels for faster resolution',
  },
];

export function LoginLeftPanel() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentItem = CAROUSEL_ITEMS[activeSlide];

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
      <img src={LOGO} alt="exotel logo" width="99" height="30" />
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
            {currentItem.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
            {currentItem.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {CAROUSEL_ITEMS.map((_, index) => (
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
                  backgroundColor: index === activeSlide ? '#333' : '#d9d9d9',
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
