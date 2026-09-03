import { Box, Typography, Button } from '@exotel-npm-dev/signal-design-system';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectLoginResponse } from '../authSlice';
import { getHomeRouteForUser } from '../utils';

export function AccessDeniedPage() {
  const navigate = useNavigate();
  const loginResponse = useAppSelector(selectLoginResponse);
  const homeRoute = getHomeRouteForUser(loginResponse?.userSessionInfo?.userType);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 8,
      }}
    >
      <Typography variant="h4">Access Denied</Typography>
      <Typography variant="body1" color="text.secondary">
        You don&apos;t have permission to view this page.
      </Typography>
      <Button variant="contained" onClick={() => navigate(homeRoute)}>
        Go to Home
      </Button>
    </Box>
  );
}
