import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Snackbar, Typography } from '@exotel-npm-dev/signal-design-system';
import {
  SnackbarContext,
  type SnackbarContextValue,
  type SnackbarOptions,
  type SnackbarOrigin,
} from './snackbarContext';

interface SnackbarItem extends Required<Omit<SnackbarOptions, 'title'>> {
  id: string;
  message: ReactNode;
  title?: ReactNode;
}

const DEFAULT_AUTO_HIDE_DURATION = 5000;
const DEFAULT_ANCHOR_ORIGIN: SnackbarOrigin = { vertical: 'bottom', horizontal: 'left' };

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SnackbarItem[]>([]);
  const [current, setCurrent] = useState<SnackbarItem | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const idCounter = useRef(0);

  // Drive the queue: surface the next item when nothing is showing, and close
  // the active one early if a new notification arrives so they don't overlap.
  useEffect(() => {
    if (queue.length && !current) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
      setOpen(true);
    } else if (queue.length && current && open) {
      setOpen(false);
    }
  }, [queue, current, open]);

  const enqueue = useCallback((message: ReactNode, options?: SnackbarOptions): string => {
    idCounter.current += 1;
    const id = `snackbar-${idCounter.current}`;
    const item: SnackbarItem = {
      id,
      message,
      title: options?.title,
      severity: options?.severity ?? 'info',
      autoHideDuration:
        options?.autoHideDuration === undefined
          ? DEFAULT_AUTO_HIDE_DURATION
          : options.autoHideDuration,
      anchorOrigin: options?.anchorOrigin ?? DEFAULT_ANCHOR_ORIGIN,
    };
    setQueue((prev) => [...prev, item]);
    return id;
  }, []);

  const closeSnackbar = useCallback(
    (id?: string) => {
      if (id) {
        setQueue((prev) => prev.filter((item) => item.id !== id));
      }
      if (!id || current?.id === id) {
        setOpen(false);
      }
    },
    [current],
  );

  const value = useMemo<SnackbarContextValue>(
    () => ({
      showSnackbar: enqueue,
      showSuccess: (message, options) => enqueue(message, { ...options, severity: 'success' }),
      showError: (message, options) => enqueue(message, { ...options, severity: 'error' }),
      showWarning: (message, options) => enqueue(message, { ...options, severity: 'warning' }),
      showInfo: (message, options) => enqueue(message, { ...options, severity: 'info' }),
      closeSnackbar,
    }),
    [enqueue, closeSnackbar],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        key={current?.id}
        open={open}
        autoHideDuration={current?.autoHideDuration ?? undefined}
        anchorOrigin={current?.anchorOrigin ?? DEFAULT_ANCHOR_ORIGIN}
        onClose={(_event, reason) => {
          if (reason === 'clickaway') return;
          setOpen(false);
        }}
        // Clear the current item only after the exit transition completes so the
        // next queued notification can take over cleanly.
        slotProps={{ transition: { onExited: () => setCurrent(undefined) } }}
      >
        <Alert
          severity={current?.severity}
          variant="filled"
          onClose={() => setOpen(false)}
          sx={{ width: '100%' }}
        >
          {current?.title ? (
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {current.title}
            </Typography>
          ) : null}
          {current?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
