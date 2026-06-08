import { Box } from '@exotel-npm-dev/signal-design-system';
import ProcessEmptyState from '../components/ProcessEmptyState';

export function Component() {
  const handleCreateProcess = () => {
    // TODO: open create process dialog or navigate to creation flow
  };

  return (
    <Box sx={{ height: '100%' }}>
      <ProcessEmptyState onCreateProcess={handleCreateProcess} />
    </Box>
  );
}
