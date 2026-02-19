'use client';

import { Snackbar, Alert, AlertProps } from '@mui/material';

export interface MutationSnackbarProps {
  open: boolean;
  message: string;
  severity?: AlertProps['severity'];
  onClose: () => void;
  autoHideDuration?: number;
}

/**
 * Single Snackbar + Alert for mutation feedback (success/error).
 * Use with goals, activity, workouts, profile, routines to avoid repeating JSX.
 */
export function MutationSnackbar({
  open,
  message,
  severity = 'success',
  onClose,
  autoHideDuration = 6000,
}: MutationSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
