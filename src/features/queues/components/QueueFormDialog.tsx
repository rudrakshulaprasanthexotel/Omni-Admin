import { useState } from 'react';
import {
  Box,
  Button,
  DialogBody,
  DialogFooter,
  EnhancedTextField,
  MenuItem,
  StructuredDialog,
} from '@exotel-npm-dev/signal-design-system';
import { QueueStatus, RoutingStrategy, type Queue, type QueueFormValues } from '../types';

interface QueueFormDialogProps {
  open: boolean;
  initialQueue?: Queue | null;
  onClose: () => void;
  onSubmit: (values: QueueFormValues) => void;
}

const EMPTY_FORM: QueueFormValues = {
  name: '',
  description: '',
  strategy: RoutingStrategy.ROUND_ROBIN,
  agents: 0,
  status: QueueStatus.ACTIVE,
};

const QueueFormDialog = ({ open, initialQueue, onClose, onSubmit }: QueueFormDialogProps) => {
  const isEdit = Boolean(initialQueue);
  const [values, setValues] = useState<QueueFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof QueueFormValues, string>>>({});
  const [wasOpen, setWasOpen] = useState(false);

  // Reset the form to match the target queue whenever the dialog transitions to open.
  if (open && !wasOpen) {
    setWasOpen(true);
    if (initialQueue) {
      const { name, description, strategy, agents, status } = initialQueue;
      setValues({ name, description, strategy, agents, status });
    } else {
      setValues(EMPTY_FORM);
    }
    setErrors({});
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const updateField = <K extends keyof QueueFormValues>(field: K, value: QueueFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof QueueFormValues, string>> = {};
    if (!values.name.trim()) nextErrors.name = 'Name is required';
    if (values.agents < 0) nextErrors.agents = 'Agents cannot be negative';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
    });
  };

  return (
    <StructuredDialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Queue' : 'Add Queue'}
      fullWidth
      maxWidth="sm"
    >
      <DialogBody>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <EnhancedTextField
            label="Name"
            value={values.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
          />
          <EnhancedTextField
            label="Description"
            value={values.description}
            onChange={(e) => updateField('description', e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <EnhancedTextField
            label="Routing Strategy"
            select
            value={values.strategy}
            onChange={(e) => updateField('strategy', e.target.value as RoutingStrategy)}
            fullWidth
          >
            {Object.values(RoutingStrategy).map((strategy) => (
              <MenuItem key={strategy} value={strategy}>
                {strategy}
              </MenuItem>
            ))}
          </EnhancedTextField>
          <EnhancedTextField
            label="Assigned Agents"
            type="number"
            value={String(values.agents)}
            onChange={(e) => updateField('agents', Number(e.target.value))}
            error={Boolean(errors.agents)}
            helperText={errors.agents}
            fullWidth
          />
          <EnhancedTextField
            label="Status"
            select
            value={values.status}
            onChange={(e) => updateField('status', e.target.value as QueueStatus)}
            fullWidth
          >
            {Object.values(QueueStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </EnhancedTextField>
        </Box>
      </DialogBody>
      <DialogFooter>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEdit ? 'Save Changes' : 'Add Queue'}
        </Button>
      </DialogFooter>
    </StructuredDialog>
  );
};

export default QueueFormDialog;
