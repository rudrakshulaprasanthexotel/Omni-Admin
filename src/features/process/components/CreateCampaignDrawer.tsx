import { useState, type ChangeEvent } from 'react';
import {
  Box,
  Button,
  Drawer,
  TextField,
  MenuItem,
  Typography,
} from '@exotel-npm-dev/signal-design-system';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createCampaign } from '../asyncActions';
import { selectCreateCampaignLoading } from '../processSlice';
import { AddCampaignRequestCampaignContextTypeEnum } from '@/boilerplate/cmsApis/models/add-campaign-request';
import type { CreateCampaignFormValues } from '../types';

interface CreateCampaignDrawerProps {
  open: boolean;
  onClose: () => void;
  processId: number;
}

const EMPTY_FORM: CreateCampaignFormValues = {
  campaignContextName: '',
  description: '',
  campaignContextType: '',
};

const CAMPAIGN_TYPES = Object.entries(AddCampaignRequestCampaignContextTypeEnum).map(
  ([key, value]) => ({ key, label: value }),
);

const CreateCampaignDrawer = ({ open, onClose, processId }: CreateCampaignDrawerProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectCreateCampaignLoading);

  const [values, setValues] = useState<CreateCampaignFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCampaignFormValues, string>>>({});

  const handleClose = () => {
    setValues(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const updateField = <K extends keyof CreateCampaignFormValues>(
    field: K,
    value: CreateCampaignFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof CreateCampaignFormValues, string>> = {};
    if (!values.campaignContextName.trim()) nextErrors.campaignContextName = t('campaignNameRequired');
    if (values.campaignContextType === '') nextErrors.campaignContextType = t('campaignTemplateRequired');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await dispatch(
        createCampaign({
          processId,
          campaignContextName: values.campaignContextName.trim(),
          description: values.description.trim() || undefined,
          campaignContextType: values.campaignContextType as AddCampaignRequestCampaignContextTypeEnum,
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
      title={t('createCampaignTitle')}
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label={t('campaignNameLabel')}
          placeholder={t('campaignNamePlaceholder')}
          value={values.campaignContextName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('campaignContextName', e.target.value)}
          error={Boolean(errors.campaignContextName)}
          helperText={errors.campaignContextName}
          required
        />
        <TextField
          label={t('campaignDescriptionLabel')}
          placeholder={t('campaignDescriptionPlaceholder')}
          value={values.description}
          onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('description', e.target.value)}
          multiline
          minRows={3}
          required
        />
        <TextField
          label={t('campaignTemplateLabel')}
          placeholder={t('campaignTemplatePlaceholder')}
          select
          value={values.campaignContextType}
          onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('campaignContextType', e.target.value as CreateCampaignFormValues['campaignContextType'])}
          error={Boolean(errors.campaignContextType)}
          helperText={errors.campaignContextType}
          required
        >
          {CAMPAIGN_TYPES.map((type) => (
            <MenuItem key={type.key} value={type.label}>
              <Typography variant="body2">{type.label}</Typography>
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Drawer>
  );
};

export default CreateCampaignDrawer;
