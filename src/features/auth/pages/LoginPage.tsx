import { Box } from '@exotel-npm-dev/signal-design-system';
import { LoginLeftPanel } from '../components/LoginLeftPanel';
import { LoginRightPanel } from '../components/LoginRightPanel';
import useIsMobile from '@/shared/hooks/useIsMobile';

export function Component() {
  const isMobile = useIsMobile();

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {!isMobile && <LoginLeftPanel />}
      <LoginRightPanel />
    </Box>
  );
}
