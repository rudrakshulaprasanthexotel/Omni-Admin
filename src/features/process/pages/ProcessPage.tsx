import { useEffect, useState } from 'react';
import { Box } from '@exotel-npm-dev/signal-design-system';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectContactCenterId } from '@/features/auth/authSlice';
import { getProcessList } from '../asyncActions';
import { selectGetProcessListLoading, selectProcessList } from '../processSlice';
import ProcessEmptyState from '../components/ProcessEmptyState';
import ProcessListPanel from '../components/ProcessListPanel';
import ProcessDetailView from '../components/ProcessDetailView';
import CreateProcessDrawer from '../components/CreateProcessDrawer';
import LoadingOverlay from '@/shared/components/feedback/LoadingOverlay';

export function ProcessPage() {
  const dispatch = useAppDispatch();
  const contactCenterId = useAppSelector(selectContactCenterId);
  const processList = useAppSelector(selectProcessList);
  const loading = useAppSelector(selectGetProcessListLoading);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    dispatch(getProcessList(contactCenterId));
  }, []);

  const hasProcesses = processList.length > 0;

  if (loading && !hasProcesses) {
    return (
      <Box sx={{ height: '100%', position: 'relative' }}>
        <LoadingOverlay loading />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100% + 16px)', m: -1, display: 'flex' }}>
      {hasProcesses ? (
        <>
          <ProcessListPanel
            collapsed={panelCollapsed}
            onToggleCollapse={() => setPanelCollapsed((prev) => !prev)}
            onCreateProcess={() => setDrawerOpen(true)}
          />
          <ProcessDetailView
            panelCollapsed={panelCollapsed}
            onExpandPanel={() => setPanelCollapsed(false)}
          />
        </>
      ) : (
        <ProcessEmptyState onCreateProcess={() => setDrawerOpen(true)} />
      )}
      <CreateProcessDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Box>
  );
}

export const Component = ProcessPage;
