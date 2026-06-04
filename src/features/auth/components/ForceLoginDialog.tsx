import {
  Button,
  StructuredDialog,
  Typography,
} from '@exotel-npm-dev/signal-design-system';
import { useTranslation } from 'react-i18next';

interface ForceLoginDialogProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ForceLoginDialog({ open, loading, onCancel, onConfirm }: ForceLoginDialogProps) {
  const { t } = useTranslation();

  return (
    <StructuredDialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      title={t('forceLoginTitle')}
      showFooter
      footerContent={
        <>
          <Button variant="outlined" color="secondary" onClick={onCancel} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button variant="contained" onClick={onConfirm} loading={loading} loadingPosition="end">
            {t('ok')}
          </Button>
        </>
      }
    >
      <Typography variant="body1">{t('forceLoginMessage')}</Typography>
    </StructuredDialog>
  );
}
