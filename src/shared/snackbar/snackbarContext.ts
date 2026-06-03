import { createContext } from 'react';
import type { ReactNode } from 'react';

export type SnackbarSeverity = 'success' | 'info' | 'warning' | 'error';

export interface SnackbarOrigin {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
}

export interface SnackbarOptions {
  /** Visual severity of the notification. Defaults to `info`. */
  severity?: SnackbarSeverity;
  /** Optional bold title rendered above the message. */
  title?: ReactNode;
  /**
   * Time in ms before the snackbar auto-dismisses. Pass `null` to keep it
   * open until the user closes it. Defaults to 5000ms.
   */
  autoHideDuration?: number | null;
  /** Screen position of the snackbar. Defaults to bottom-left. */
  anchorOrigin?: SnackbarOrigin;
}

export interface SnackbarContextValue {
  /**
   * Show a snackbar with full control over options. Returns the id of the
   * enqueued notification, which can be passed to `closeSnackbar`.
   */
  showSnackbar: (message: ReactNode, options?: SnackbarOptions) => string;
  showSuccess: (message: ReactNode, options?: Omit<SnackbarOptions, 'severity'>) => string;
  showError: (message: ReactNode, options?: Omit<SnackbarOptions, 'severity'>) => string;
  showWarning: (message: ReactNode, options?: Omit<SnackbarOptions, 'severity'>) => string;
  showInfo: (message: ReactNode, options?: Omit<SnackbarOptions, 'severity'>) => string;
  /** Close the currently visible snackbar (or a specific one by id). */
  closeSnackbar: (id?: string) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);
