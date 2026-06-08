import { Box } from '@exotel-npm-dev/signal-design-system';
import ProcessEmptyState from '../components/ProcessEmptyState';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectContactCenterId } from '@/features/auth/authSlice';
import { getProcessList } from '../asyncActions';

export function Component() {
  const dispatch = useAppDispatch();
  const contactCenterId = useAppSelector(selectContactCenterId);

  useEffect(() => {
    dispatch(getProcessList(contactCenterId));
  }, []);

  const handleCreateProcess = () => {
    // TODO: open create process dialog or navigate to creation flow
  };

  return (
    <Box sx={{ height: '100%' }}>
      <ProcessEmptyState onCreateProcess={handleCreateProcess} />
    </Box>
  );
}
