import { useContext } from 'react';
import { SnackbarContext, type SnackbarContextValue } from './snackbarContext';

/**
 * Access the global snackbar controls. Must be used within a `SnackbarProvider`
 * (mounted near the app root), which makes it invokable from anywhere.
 *
 * @example
 * const { showSuccess, showError } = useSnackbar();
 * showSuccess('Saved successfully');
 * showError('Something went wrong', { title: 'Error' });
 */
export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a <SnackbarProvider>.');
  }
  return context;
}
