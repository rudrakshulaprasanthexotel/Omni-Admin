import { useState } from 'react';
import { Box, FormField, Button, IconButton, Icon, Typography } from '@exotel-npm-dev/signal-design-system';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '../asyncActions';
import { selectLoginError, selectLoginLoading } from '../authSlice';

export function LoginForm() {
  const dispatch = useAppDispatch();
  const loginLoading = useAppSelector(selectLoginLoading);
  const loginError = useAppSelector(selectLoginError);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) return;

    dispatch(
      login({
        userId,
        token: password,
        domain: window.location.hostname,
      }),
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 400 }}>
        <Typography variant="h3" fontWeight={600} sx={{ mb: 2 }}>
          Welcome!
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
          <FormField
            label="Enter User ID"
            placeholder="Enter User ID"
            required
            fullWidth
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loginLoading}
          />

          <FormField
            label="Enter Password"
            placeholder="Enter Password"
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
          disabled={loginLoading || !userId.trim() || !password.trim()}
        >
          {loginLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {loginError && (
          <Typography variant="body2" color="error" sx={{ mt: 1, textAlign: 'center' }}>
            {loginError}
          </Typography>
        )}
      </Box>
    </form>
  );
}
