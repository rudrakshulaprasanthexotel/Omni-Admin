import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  EnhancedTextField,
  Icon,
  IconButton,
  InputAdornment,
} from '@exotel-npm-dev/signal-design-system';
import loginIllustration from '../../assets/images/login-illustration.svg';

const CAROUSEL_SLIDES = [
  {
    title: 'All in One Unified Agent Workspace',
    subtitle: 'Securely access your tools and manage customer conversations',
  },
  {
    title: 'Real-time Queue Monitoring',
    subtitle: 'Track agent performance and manage queues efficiently',
  },
  {
    title: 'Advanced Analytics Dashboard',
    subtitle: 'Gain insights into your contact center operations',
  },
];

export function Component() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: dispatch login thunk
    console.log('Login submitted', { userId, password });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Panel — Branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#FDF8F4',
          px: 6,
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: 32, left: 40 }}>
          <Typography
            sx={{
              fontFamily: '"Noto Sans", sans-serif',
              fontSize: '1.25rem',
              fontWeight: 300,
              letterSpacing: '0.1em',
              color: '#1a1a1a',
            }}
          >
            exotel
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 400,
            textAlign: 'center',
            gap: 3,
          }}
        >
          <img
            src={loginIllustration}
            alt="Agent workspace illustration"
            style={{ width: '100%', maxWidth: 320, height: 'auto', marginBottom: 16 }}
          />

          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}
          >
            {CAROUSEL_SLIDES[activeSlide].title}
          </Typography>

          <Typography variant="body2" sx={{ color: '#666', maxWidth: 340 }}>
            {CAROUSEL_SLIDES[activeSlide].subtitle}
          </Typography>

          {/* Carousel Dots */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {CAROUSEL_SLIDES.map((_, index) => (
              <Box
                key={index}
                onClick={() => setActiveSlide(index)}
                sx={{
                  width: index === activeSlide ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: index === activeSlide ? '#1a1a1a' : '#ccc',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right Panel — Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 6 },
          position: 'relative',
        }}
      >
        {/* Language Selector */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
            🇺🇸
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
            EN
          </Typography>
        </Box>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: '100%',
            maxWidth: 380,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}
          >
            Welcome!
          </Typography>

          <EnhancedTextField
            label="Enter User ID"
            required
            fullWidth
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter User ID"
          />

          <EnhancedTextField
            label="Enter Password"
            required
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      <Icon
                        name={showPassword ? 'eye' : 'eye-slash'}
                        size="sm"
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{
              mt: 1,
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            Sign In
          </Button>
        </Box>

        {/* Copyright */}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 24,
            color: '#999',
          }}
        >
          © Exotel 2025
        </Typography>
      </Box>
    </Box>
  );
}
