import { useEffect, useState } from 'react';
import { Box } from '@exotel-npm-dev/signal-design-system';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSelectedProcessId, setSelectedProcessId } from '../processSlice';
import { useProcessList } from '../queries';
import ProcessEmptyState from '../components/ProcessEmptyState';
import ProcessListPanel from '../components/ProcessListPanel';
import ProcessDetailView from '../components/ProcessDetailView';
import CreateProcessDrawer from '../components/CreateProcessDrawer';
import LoadingOverlay from '@/shared/components/feedback/LoadingOverlay';

export function ProcessPage() {
  const dispatch = useAppDispatch();
  const selectedProcessId = useAppSelector(selectSelectedProcessId);
  const { data: processList = [], isLoading } = useProcessList();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const firstProcessId = processList[0]?.processId ?? null;

  useEffect(() => {
    if (selectedProcessId !== null || firstProcessId === null) return;
    dispatch(setSelectedProcessId(firstProcessId));
  }, [dispatch, selectedProcessId, firstProcessId]);

  const hasProcesses = processList.length > 0;

  if (isLoading) {
    return (
      <Box sx={{ height: '100%', position: 'relative' }}>
        <LoadingOverlay loading />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {hasProcesses ? (
        <>
          <ProcessListPanel
            collapsed={panelCollapsed}
            onToggleCollapse={() => setPanelCollapsed((prev) => !prev)}
            onCreateProcess={() => setDrawerOpen(true)}
          />
          <ProcessDetailView />
        </>
      ) : (
        <ProcessEmptyState onCreateProcess={() => setDrawerOpen(true)} />
      )}
      <CreateProcessDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Box>
  );
}

export const Component = ProcessPage;
