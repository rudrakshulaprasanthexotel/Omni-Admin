import { Box, Typography } from '@exotel-npm-dev/signal-design-system';
import { LoginForm } from './LoginForm';

export function LoginRightPanel() {
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
      {/* Language selector */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            px: 1.5,
            py: 0.75,
            borderRadius: '6px',
          }}
        >
          <Box component="span" sx={{ fontSize: 16 }}>🇮🇳</Box>
          <Typography variant="body2" fontWeight={500} color="text.primary">
            EN
          </Typography>
        </Box>
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
