import { Box, Typography } from '@exotel-npm-dev/signal-design-system';
import { LoginForm } from './LoginForm';
import LanguageSwitcher from './LanguageSwitcher';
import BrandLogo from '@/shared/components/brandLogo';
import useIsMobile from '@/shared/hooks/useIsMobile';

export function LoginRightPanel() {
  const isMobile = useIsMobile();

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        p: 4,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
        {isMobile && <BrandLogo />}
        <LanguageSwitcher />
      </Box>

      {/* Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LoginForm />
        </Box>
      </Box>

      {/* Copyright */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="caption" color="text.secondary">
          &copy; Exotel {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}
