import { Box, Typography } from '@exotel-npm-dev/signal-design-system';
import { useAppSelector } from '@/store/hooks';
import { selectLoginResponse } from '@/features/auth/authSlice';

export function Component() {
  const loginResponse = useAppSelector(selectLoginResponse);
  const userName = loginResponse?.userSessionInfo?.userName ?? '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4">Supervisor Dashboard</Typography>
      <Typography variant="body1">
        Welcome back, <strong>{userName}</strong>! Here&apos;s an overview of your team&apos;s activity.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Live monitoring, team performance, and queue insights are available from the sidebar.
      </Typography>
    </Box>
  );
}
