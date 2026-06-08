import { Box, Button, Typography } from '@exotel-npm-dev/signal-design-system';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

function resolveError(
  error: unknown,
  t: (key: string) => string,
): { title: string; message: string } {
  if (isRouteErrorResponse(error)) {
    return {
      title: `${error.status} ${error.statusText}`,
      message:
        typeof error.data === 'string' ? error.data : t('pageNotLoaded'),
    };
  }

  if (error instanceof Error) {
    return {
      title: t('somethingWentWrong'),
      message: error.message,
    };
  }

  return {
    title: t('somethingWentWrong'),
    message: t('unexpectedError'),
  };
}

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { title, message } = resolveError(error, t);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: '100vh',
        px: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4">{title}</Typography>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <Button variant="outlined" onClick={() => navigate(0)}>
          {t('reload')}
        </Button>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('goToHome')}
        </Button>
      </Box>
    </Box>
  );
}

export default ErrorBoundary;
