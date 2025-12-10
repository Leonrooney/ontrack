'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { apiGet, apiPut } from '@/lib/api';
import { PreferencesUpdateInput } from '@/lib/validators';

export interface UserPreferences {
  id: string;
  userId: string;
  defaultRestSeconds: number;
}

async function fetchPreferences(): Promise<UserPreferences> {
  return apiGet<UserPreferences>('/api/preferences');
}

async function updatePreferences(input: PreferencesUpdateInput): Promise<UserPreferences> {
  return apiPut<UserPreferences>('/api/preferences', input);
}

export function useUserPreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const mutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      setSnackbar({ open: true, message: 'Preferences updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update preferences', severity: 'error' });
    },
  });

  return {
    ...mutation,
    snackbar,
    closeSnackbar: () => setSnackbar({ ...snackbar, open: false }),
  };
}



