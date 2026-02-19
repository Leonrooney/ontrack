'use client';

import { useState } from 'react';
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export interface PasswordFieldProps
  extends Omit<TextFieldProps, 'type' | 'InputProps'> {
  /** Optional; defaults to internal state for visibility toggle */
  showPassword?: boolean;
  onToggleVisibility?: () => void;
}

/**
 * Password input with visibility toggle. Reuse on signup, reset-password, profile change-password.
 */
export function PasswordField({
  showPassword: controlledShow,
  onToggleVisibility,
  ...textFieldProps
}: PasswordFieldProps) {
  const [internalShow, setInternalShow] = useState(false);
  const showPassword = controlledShow ?? internalShow;
  const toggle = onToggleVisibility ?? (() => setInternalShow((s) => !s));

  return (
    <TextField
      type={showPassword ? 'text' : 'password'}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={toggle}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...textFieldProps}
    />
  );
}
