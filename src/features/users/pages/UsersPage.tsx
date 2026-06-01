import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  DataGrid,
  GridActionsCellItem,
  Icon,
  Typography,
  type GridColDef,
  type ToolbarButtonConfig,
} from '@exotel-npm-dev/signal-design-system';
import UserFormDialog from '../components/UserFormDialog';
import DeleteUserDialog from '../components/DeleteUserDialog';
import { UserStatus, type User, type UserFormValues } from '../types';

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Aanya Sharma', email: 'aanya.sharma@example.com', role: 'Administrator', status: 'Active' },
  { id: '2', name: 'Rahul Verma', email: 'rahul.verma@example.com', role: 'Supervisor', status: 'Active' },
  { id: '3', name: 'Meera Iyer', email: 'meera.iyer@example.com', role: 'Agent', status: 'Inactive' },
  { id: '4', name: 'Karthik Nair', email: 'karthik.nair@example.com', role: 'Agent', status: 'Active' },
];

export function Component() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const openAddDialog = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (values: UserFormValues) => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((user) => (user.id === editingUser.id ? { ...user, ...values } : user)),
      );
    } else {
      setUsers((prev) => [
        ...prev,
        { id: crypto.randomUUID(), ...values },
      ]);
    }
    closeForm();
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
    setUserToDelete(null);
  };

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
      { field: 'email', headerName: 'Email', flex: 1.4, minWidth: 220 },
      { field: 'role', headerName: 'Role', flex: 1, minWidth: 150 },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            color={params.value === UserStatus.ACTIVE ? 'success' : 'default'}
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
            onClick={() => openEditDialog(params.row as User)}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<Icon name="trash" />}
            label="Delete"
            onClick={() => setUserToDelete(params.row as User)}
          />,
        ],
      },
    ],
    [],
  );

  const toolbarButtons = useMemo<ToolbarButtonConfig[]>(
    () => [
      {
        id: 'add-user',
        icon: <Icon name="plus" />,
        label: 'Add User',
        tooltip: 'Add a new user',
        color: 'primary',
        onClick: openAddDialog,
      },
    ],
    [],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
      <Box>
        <Typography variant="h4">Users</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage user accounts, roles, and access permissions.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 400 }}>
        <DataGrid
          rows={users}
          columns={columns}
          customToolbarButtons={toolbarButtons}
          disableRowSelectionOnClick
          emptyStateMessage="No users yet. Add your first user to get started."
        />
      </Box>

      <UserFormDialog
        open={formOpen}
        initialUser={editingUser}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
      <DeleteUserDialog
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
