import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  EnhancedTextField,
  MenuItem,
} from '@exotel-npm-dev/signal-design-system';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectContactCenterId } from '@/features/auth/authSlice';
import { createProcess, getAllTableDefinitions } from '../asyncActions';
import { selectCreateProcessLoading, selectGetTableDefinitionsLoading, selectTableDefinitions } from '../processSlice';
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
  const dispatch = useAppDispatch();
  const contactCenterId = useAppSelector(selectContactCenterId);
  const loading = useAppSelector(selectCreateProcessLoading);
  const tableDefinitionsLoading = useAppSelector(selectGetTableDefinitionsLoading);
  const tableDefinitions = useAppSelector(selectTableDefinitions);

  const [values, setValues] = useState<CreateProcessFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateProcessFormValues, string>>>({});

  const handleClose = () => {
    setValues(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    dispatch(getAllTableDefinitions());
  }, [open]);

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

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await dispatch(
        createProcess({
          contactCenterId,
          processName: values.processName.trim(),
          description: values.description.trim() || undefined,
          tableDefinitionId: values.tableDefinitionId as number,
        }),
      ).unwrap();
      handleClose();
    } catch {
      // error is handled in the slice
    }
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
          <EnhancedTextField
            label={t('processNameLabel')}
            placeholder={t('processNamePlaceholder')}
            value={values.processName}
            onChange={(e) => updateField('processName', e.target.value)}
            error={Boolean(errors.processName)}
            helperText={errors.processName}
            required
          />
          <EnhancedTextField
            label={t('processDescriptionLabel')}
            placeholder={t('processDescriptionPlaceholder')}
            value={values.description}
            onChange={(e) => updateField('description', e.target.value)}
            multiline
            minRows={3}
          />
          <EnhancedTextField
            label={t('tableDefinitionLabel')}
            placeholder={t('tableDefinitionPlaceholder')}
            select
            value={values.tableDefinitionId}
            onChange={(e) => updateField('tableDefinitionId', Number(e.target.value))}
            error={Boolean(errors.tableDefinitionId)}
            helperText={errors.tableDefinitionId}
            required
          >
            {tableDefinitions.map((td) => (
              <MenuItem key={td.tableDefinitionId} value={td.tableDefinitionId}>
                {td.tableDefinitionName}
              </MenuItem>
            ))}
          </EnhancedTextField>
        </Box>
      </>
    </Drawer>
  );
};

export default CreateProcessDrawer;
