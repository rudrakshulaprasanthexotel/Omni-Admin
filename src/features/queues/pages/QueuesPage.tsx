import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  DataGrid,
  GridActionsCellItem,
  Icon,
  Typography,
  type GridColDef,
  type GridFilterModel,
  type ToolbarButtonConfig,
} from '@exotel-npm-dev/signal-design-system';
import { useCopilotReadable } from '@copilotkit/react-core';
import QueueFormDialog from '../components/QueueFormDialog';
import DeleteQueueDialog from '../components/DeleteQueueDialog';
import { QueueStatus, type Queue, type QueueFormValues } from '../types';
import { useCopilotCommand } from '@/features/copilot/CopilotCommandRegistry';

const INITIAL_QUEUES: Queue[] = [
  { id: '1', name: 'Sales', description: 'Inbound sales enquiries', strategy: 'Round Robin', agents: 12, status: 'Active' },
  { id: '2', name: 'Support', description: 'Customer support tickets', strategy: 'Skill Based', agents: 24, status: 'Active' },
  { id: '3', name: 'Billing', description: 'Payment and invoice queries', strategy: 'Least Busy', agents: 6, status: 'Paused' },
  { id: '4', name: 'Onboarding', description: 'New customer onboarding', strategy: 'Longest Idle', agents: 4, status: 'Active' },
];

export function Component() {
  const [queues, setQueues] = useState<Queue[]>(INITIAL_QUEUES);
  const [formOpen, setFormOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);
  const [queueToDelete, setQueueToDelete] = useState<Queue | null>(null);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  const openAddDialog = () => {
    setEditingQueue(null);
    setFormOpen(true);
  };

  const openEditDialog = (queue: Queue) => {
    setEditingQueue(queue);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingQueue(null);
  };

  const handleSubmit = (values: QueueFormValues) => {
    if (editingQueue) {
      setQueues((prev) =>
        prev.map((queue) => (queue.id === editingQueue.id ? { ...queue, ...values } : queue)),
      );
    } else {
      setQueues((prev) => [...prev, { id: crypto.randomUUID(), ...values }]);
    }
    closeForm();
  };

  const handleDelete = () => {
    if (!queueToDelete) return;
    setQueues((prev) => prev.filter((queue) => queue.id !== queueToDelete.id));
    setQueueToDelete(null);
  };

  useCopilotReadable({
    description: 'The list of call queues currently shown in the admin Queues table.',
    value: queues,
  });

  // Applies a quick filter to the Queues table, as if typing into the filter box.
  useCopilotCommand('queues.filter', (args) => {
    const query = String(args.query ?? '').trim();
    setFilterModel({ items: [], quickFilterValues: query ? query.split(/\s+/) : [] });
    return query ? `Filtered the Queues table by "${query}".` : 'Cleared the Queues filter.';
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
      { field: 'description', headerName: 'Description', flex: 1.4, minWidth: 220 },
      { field: 'strategy', headerName: 'Routing Strategy', flex: 1, minWidth: 160 },
      {
        field: 'agents',
        headerName: 'Agents',
        type: 'number',
        flex: 0.6,
        minWidth: 100,
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            color={params.value === QueueStatus.ACTIVE ? 'success' : 'warning'}
            variant="outlined"
          />
        ),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 120,
        getActions: (params) => [
          <GridActionsCellItem
            key="edit"
            icon={<Icon name="pencil-simple" />}
            label="Edit"
            onClick={() => openEditDialog(params.row as Queue)}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<Icon name="trash" />}
            label="Delete"
            onClick={() => setQueueToDelete(params.row as Queue)}
          />,
        ],
      },
    ],
    [],
  );

  const toolbarButtons = useMemo<ToolbarButtonConfig[]>(
    () => [
      {
        id: 'add-queue',
        icon: <Icon name="plus" />,
        label: 'Add Queue',
        tooltip: 'Add a new queue',
        color: 'primary',
        onClick: openAddDialog,
      },
    ],
    [],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
      <Box>
        <Typography variant="h4">Queues</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure and monitor call queues and routing rules.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 400 }}>
        <DataGrid
          rows={queues}
          columns={columns}
          customToolbarButtons={toolbarButtons}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          disableRowSelectionOnClick
          emptyStateMessage="No queues yet. Add your first queue to get started."
        />
      </Box>

      <QueueFormDialog
        open={formOpen}
        initialQueue={editingQueue}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
      <DeleteQueueDialog
        queue={queueToDelete}
        onClose={() => setQueueToDelete(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
