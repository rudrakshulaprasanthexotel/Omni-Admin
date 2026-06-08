import { Box } from '@exotel-npm-dev/signal-design-system';
import ProcessEmptyState from '../components/ProcessEmptyState';
import CreateProcessDrawer from '../components/CreateProcessDrawer';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectContactCenterId } from '@/features/auth/authSlice';
import { getProcessList } from '../asyncActions';

export function Component() {
  const dispatch = useAppDispatch();
  const contactCenterId = useAppSelector(selectContactCenterId);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    dispatch(getProcessList(contactCenterId));
  }, []);

  return (
    <Box sx={{ height: '100%' }}>
      <ProcessEmptyState onCreateProcess={() => setDrawerOpen(true)} />
      <CreateProcessDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Box>
  );
}
