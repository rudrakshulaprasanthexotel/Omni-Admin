import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@exotel-npm-dev/signal-design-system';
import { useAppSelector } from '@/store/hooks';
import { selectLoginResponse } from '@/features/auth/authSlice';
import { getHomeRouteForUser } from '@/features/auth/utils';
import { useEffect } from 'react';

export function PublicLayout() {
  const loginResponse = useAppSelector(selectLoginResponse);
  const navigate = useNavigate();

  useEffect(() => {
    if (loginResponse) {
      navigate(getHomeRouteForUser(loginResponse.userSessionInfo?.userType), { replace: true });
    }
  }, [])

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Outlet />
    </Box>
  );
}
