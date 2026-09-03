import { useState, type ChangeEvent } from 'react';
import {
  Box,
  Button,
  Drawer,
  TextField,
  MenuItem,
} from '@exotel-npm-dev/signal-design-system';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { selectContactCenterId } from '@/features/auth/authSlice';
import { useCreateProcess, useTableDefinitions } from '../queries';
import type { CreateProcessFormValues } from '../types';
import LoadingOverlay from '@/shared/components/feedback/LoadingOverlay';

interface CreateProcessDrawerProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM: CreateProcessFormValues = {
  processName: '',
  description: '',
  tableDefinitionId: '',
};

const CreateProcessDrawer = ({ open, onClose }: CreateProcessDrawerProps) => {
  const { t } = useTranslation();
  const contactCenterId = useAppSelector(selectContactCenterId);
  const createProcess = useCreateProcess();
  const { data: tableDefinitions = [], isLoading: tableDefinitionsLoading } =
    useTableDefinitions(open);
  const loading = createProcess.isPending;

  const [values, setValues] = useState<CreateProcessFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateProcessFormValues, string>>>({});

  const handleClose = () => {
    setValues(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const updateField = <K extends keyof CreateProcessFormValues>(
    field: K,
    value: CreateProcessFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof CreateProcessFormValues, string>> = {};
    if (!values.processName.trim()) nextErrors.processName = t('processNameRequired');
    if (values.tableDefinitionId === '') nextErrors.tableDefinitionId = t('tableDefinitionRequired');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (contactCenterId == null) return;

    createProcess.mutate(
      {
        contactCenterId,
        processName: values.processName.trim(),
        description: values.description.trim() || undefined,
        tableDefinitionId: values.tableDefinitionId as number,
      },
      { onSuccess: handleClose },
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      title={t('createProcessTitle')}
      PaperProps={{ sx: { width: { xs: '100%', sm: 479 } } }}
      footerActions={
        <>
          <Button variant="outlined" color="inherit" onClick={handleClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>
            {t('save')}
          </Button>
        </>
      }
    >
      <>
        {tableDefinitionsLoading && <LoadingOverlay loading={tableDefinitionsLoading} />}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('processNameLabel')}
            placeholder={t('processNamePlaceholder')}
            value={values.processName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('processName', e.target.value)}
            error={Boolean(errors.processName)}
            helperText={errors.processName}
            required
          />
          <TextField
            label={t('processDescriptionLabel')}
            placeholder={t('processDescriptionPlaceholder')}
            value={values.description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('description', e.target.value)}
            multiline
            minRows={3}
          />
          <TextField
            label={t('tableDefinitionLabel')}
            placeholder={t('tableDefinitionPlaceholder')}
            select
            value={values.tableDefinitionId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('tableDefinitionId', Number(e.target.value))}
            error={Boolean(errors.tableDefinitionId)}
            helperText={errors.tableDefinitionId}
            required
          >
            {tableDefinitions.map((td) => (
              <MenuItem key={td.tableDefinitionId} value={td.tableDefinitionId}>
                {td.tableDefinitionName}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </>
    </Drawer>
  );
};

export default CreateProcessDrawer;
