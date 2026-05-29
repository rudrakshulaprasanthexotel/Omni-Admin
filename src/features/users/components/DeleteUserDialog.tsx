import {
  Box,
  Button,
  DialogBody,
  DialogFooter,
  StructuredDialog,
  Typography,
} from '@exotel-npm-dev/signal-design-system';
import type { User } from '../types';

interface DeleteUserDialogProps {
  user: User | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteUserDialog = ({ user, onClose, onConfirm }: DeleteUserDialogProps) => {
  return (
    <StructuredDialog
      open={Boolean(user)}
      onClose={onClose}
      title="Delete User"
      fullWidth
      maxWidth="xs"
    >
      <DialogBody>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{user?.name}</strong>? This action cannot be
            undone.
          </Typography>
        </Box>
      </DialogBody>
      <DialogFooter>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          Delete
        </Button>
      </DialogFooter>
    </StructuredDialog>
  );
};

export default DeleteUserDialog;
