import {
  Box,
  Button,
  DialogBody,
  DialogFooter,
  StructuredDialog,
  Typography,
} from '@exotel-npm-dev/signal-design-system';
import type { Queue } from '../types';

interface DeleteQueueDialogProps {
  queue: Queue | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteQueueDialog = ({ queue, onClose, onConfirm }: DeleteQueueDialogProps) => {
  return (
    <StructuredDialog
      open={Boolean(queue)}
      onClose={onClose}
      title="Delete Queue"
      fullWidth
      maxWidth="xs"
    >
      <DialogBody>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{queue?.name}</strong>? This action cannot be
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

export default DeleteQueueDialog;
