'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiGet, apiPut } from '@/lib/api';
import { ProfileUpdateInput } from '@/lib/validators';

export interface Profile {
  id: string;
  email: string;
  name: string;
  unitPreference: 'metric' | 'imperial';
  themePreference: 'system' | 'light' | 'dark';
}

async function fetchProfile(): Promise<Profile> {
  return apiGet<Profile>('/api/profile');
}

async function updateProfile(input: ProfileUpdateInput): Promise<Profile> {
  return apiPut<Profile>('/api/profile', input);
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
    },
  });

  return {
    ...mutation,
    snackbar,
    closeSnackbar: () => setSnackbar({ ...snackbar, open: false }),
  };
}

