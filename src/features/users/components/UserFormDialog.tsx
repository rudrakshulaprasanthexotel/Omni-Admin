import { useState, type ChangeEvent } from 'react';
import {
  Box,
  Button,
  DialogBody,
  DialogFooter,
  TextField,
  MenuItem,
  StructuredDialog,
} from '@exotel-npm-dev/signal-design-system';
import { UserRole, UserStatus, type User, type UserFormValues } from '../types';

interface UserFormDialogProps {
  open: boolean;
  initialUser?: User | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
}

const EMPTY_FORM: UserFormValues = {
  name: '',
  email: '',
  role: UserRole.AGENT,
  status: UserStatus.ACTIVE,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserFormDialog = ({ open, initialUser, onClose, onSubmit }: UserFormDialogProps) => {
  const isEdit = Boolean(initialUser);
  const [values, setValues] = useState<UserFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});
  const [wasOpen, setWasOpen] = useState(false);

  // Reset the form to match the target user whenever the dialog transitions to open.
  if (open && !wasOpen) {
    setWasOpen(true);
    if (initialUser) {
      const { name, email, role, status } = initialUser;
      setValues({ name, email, role, status });
    } else {
      setValues(EMPTY_FORM);
    }
    setErrors({});
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const updateField = <K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof UserFormValues, string>> = {};
    if (!values.name.trim()) nextErrors.name = 'Name is required';
    if (!values.email.trim()) nextErrors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(values.email.trim())) nextErrors.email = 'Enter a valid email address';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
    });
  };

  return (
    <StructuredDialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'Add User'}
      fullWidth
      maxWidth="sm"
    >
      <DialogBody>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label="Name"
            value={values.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={values.email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('email', e.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            fullWidth
          />
          <TextField
            label="Role"
            select
            value={values.role}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('role', e.target.value as UserRole)}
            fullWidth
          >
            {Object.values(UserRole).map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Status"
            select
            value={values.status}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('status', e.target.value as UserStatus)}
            fullWidth
          >
            {Object.values(UserStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogBody>
      <DialogFooter>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEdit ? 'Save Changes' : 'Add User'}
        </Button>
      </DialogFooter>
    </StructuredDialog>
  );
};

export default UserFormDialog;
