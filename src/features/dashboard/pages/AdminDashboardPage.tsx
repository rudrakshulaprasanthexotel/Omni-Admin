import { Box, Typography } from '@exotel-npm-dev/signal-design-system';
import { useAppSelector } from '@/store/hooks';
import { selectLoginResponse } from '@/features/auth/authSlice';

export function Component() {
  const loginResponse = useAppSelector(selectLoginResponse);
  const userName = loginResponse?.userSessionInfo?.userName ?? '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4">Admin Dashboard</Typography>
      <Typography variant="body1">
        Welcome back, <strong>{userName}</strong>! You have full administrative access.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Manage users, view analytics, audit logs, and system settings from the sidebar.
      </Typography>
    </Box>
  );
}
