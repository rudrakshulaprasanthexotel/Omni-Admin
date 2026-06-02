import { Navigate, Outlet } from 'react-router-dom';
import { Box } from '@exotel-npm-dev/signal-design-system';
import { useAppSelector } from '@/store/hooks';
import { selectLoginResponse } from '@/features/auth/authSlice';

export function PublicLayout() {
  const loginResponse = useAppSelector(selectLoginResponse);

  if (loginResponse) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Outlet />
    </Box>
  );
}
