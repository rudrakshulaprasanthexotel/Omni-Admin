import { Outlet } from 'react-router-dom';
import { Box } from '@exotel-npm-dev/signal-design-system';

export function PublicLayout() {
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Outlet />
    </Box>
  );
}
