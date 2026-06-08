import { useState, type SubmitEvent } from 'react';
import { Box, FormField, Button, IconButton, Icon, Typography, useToast } from '@exotel-npm-dev/signal-design-system';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';
import { login, logout } from '../asyncActions';
import { clearLoginResponse, selectLoginError, selectLoginLoading } from '../authSlice';
import { ALLOWED_ROLES, LOGIN_ERROR_CODE } from '../constants';
import { ForceLoginDialog } from './ForceLoginDialog';
import { useTranslation } from 'react-i18next';
import type { NormalisedAxiosResponse } from '@/shared/utils/normaliseAxiosResponse';
import type { ILoginApiErrorData } from '../types';

export function LoginForm() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showWarning } = useToast();
  const loginLoading = useAppSelector(selectLoginLoading);
  const loginError = useAppSelector(selectLoginError);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForceLogin, setShowForceLogin] = useState(false);

  const attemptLogin = async (forceLogin: boolean) => {
    const result = await dispatch(
      login({
        userId,
        token: password,
        domain: window.location.hostname,
        forceLogin,
      }),
    ).unwrap();

    const loginData = result.response?.data;

    // Only allowed roles can use this interface; surface a notice and drop the
    // session instead of routing unsupported roles into the app.
    const userType = loginData?.userSessionInfo?.userType;
    if (!userType || !ALLOWED_ROLES.includes(userType)) {
      showWarning(t('roleNotSupported'));
      const sessionId = loginData?.userSessionInfo?.sessionId;
      if (sessionId) {
        await dispatch(logout({ sessionId, reason: 'role_not_allowed' }));
      }
      dispatch(clearLoginResponse());
      return result;
    }

    navigate('/dashboard', { replace: true });
    return result;
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) return;

    try {
      await attemptLogin(false);
    } catch (error: unknown) {
      const normalisedError = error as NormalisedAxiosResponse;
      const errorData = normalisedError?.response?.data as ILoginApiErrorData | undefined;
      if (errorData?.errorCode === LOGIN_ERROR_CODE.FORCE_LOGIN_ERROR_CODE) {
        setShowForceLogin(true);
      }
    }
  };

  const handleForceLogin = async () => {
    try {
      await attemptLogin(true);
      setShowForceLogin(false);
    } catch {
      setShowForceLogin(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 400 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          {t('welcome')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
          <FormField
            label={t('enterUserId')}
            placeholder={t('enterUserId')}
            required
            fullWidth
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loginLoading}
          />

          <FormField
            label={t('enterPassword')}
            placeholder={t('enterPassword')}
            required
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loginLoading}
            endAdornment={
              <IconButton
                size="small"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'eye-slash' : 'eye'} size="sm" />
              </IconButton>
            }
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          loading={loginLoading}
          loadingPosition='end'
          disabled={!userId.trim() || !password.trim()}
        >
          {t('signIn')}
        </Button>

        {loginError && !showForceLogin && (
          <Typography variant="body2" color="error" sx={{ mt: 1, textAlign: 'center' }}>
            {t('signInError')}
          </Typography>
        )}
      </Box>

      <ForceLoginDialog
        open={showForceLogin}
        loading={loginLoading}
        onCancel={() => setShowForceLogin(false)}
        onConfirm={handleForceLogin}
      />
    </form>
  );
}
