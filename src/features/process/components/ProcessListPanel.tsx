import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSelectedProcessId, setSelectedProcessId } from '../processSlice';
import { useProcessList } from '../queries';
import { SecondaryNavigation, type NavigationItem } from '@exotel-npm-dev/signal-design-system';

interface ProcessListPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateProcess: () => void;
}

const ProcessListPanel = ({ collapsed, onToggleCollapse, onCreateProcess }: ProcessListPanelProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data: processList = [] } = useProcessList();
  const selectedProcessId = useAppSelector(selectSelectedProcessId);

  const items: NavigationItem[] = processList.map((process) => ({
    id: process.processId ?? '',
    label: process.processName ?? '',
  }));

  return (
    <SecondaryNavigation
      title={t('processList')}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      actionLabel={t('newProcess')}
      actionIcon="plus"
      onActionClick={onCreateProcess}
      items={items}
      selectedId={selectedProcessId}
      onItemSelect={(id: string | number) => dispatch(setSelectedProcessId(id as number))}
      emptyMessage={t('noProcessFound')}
    />
  );
};

export default ProcessListPanel;
