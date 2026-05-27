import { Box } from '@exotel-npm-dev/signal-design-system';
import { LoginLeftPanel } from '../components/LoginLeftPanel';
import { LoginRightPanel } from '../components/LoginRightPanel';

export function Component() {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      <LoginLeftPanel />
      <LoginRightPanel />
    </Box>
  );
}
