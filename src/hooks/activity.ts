'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityEntry,
  ActivityResponse,
  ActivityInput,
  DateRange,
} from '@/types/activity';
import { formatDateISO } from '@/lib/format';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

async function fetchActivity(
  range: DateRange,
  date: Date
): Promise<ActivityEntry[]> {
  const params = new URLSearchParams({
    range,
    date: formatDateISO(date),
  });
  const data: ActivityResponse = await apiGet(`/api/activity?${params}`);
  return data.entries;
}

async function createActivity(input: ActivityInput): Promise<ActivityEntry> {
  return apiPost<ActivityEntry>('/api/activity', input);
}

async function updateActivity(
  id: string,
  input: Partial<ActivityInput>
): Promise<ActivityEntry> {
  return apiPatch<ActivityEntry>(`/api/activity/${id}`, input);
}

async function deleteActivity(id: string): Promise<void> {
  await apiDelete(`/api/activity/${id}`);
}

export function useActivity(range: DateRange, date: Date) {
  return useQuery({
    queryKey: ['activity', range, formatDateISO(date)],
    queryFn: () => fetchActivity(range, date),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const mutation = useMutation({
    mutationFn: createActivity,
    onMutate: async (newActivity) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['activity'] });

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        queryKey: ['activity'],
      });

      // Optimistically update
      queryClient.setQueriesData<ActivityEntry[]>(
        { queryKey: ['activity'] },
        (old = []) => [...old, newActivity as any]
      );

      return { previousQueries };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      setSnackbar({
        open: true,
        message: 'Failed to create activity',
        severity: 'error',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSnackbar({
        open: true,
        message: 'Activity created successfully',
        severity: 'success',
      });
    },
  });

  return {
    ...mutation,
    snackbar,
    closeSnackbar: () => setSnackbar({ ...snackbar, open: false }),
  };
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const mutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ActivityInput>;
    }) => updateActivity(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ['activity'] });
      const previousQueries = queryClient.getQueriesData({
        queryKey: ['activity'],
      });

      queryClient.setQueriesData<ActivityEntry[]>(
        { queryKey: ['activity'] },
        (old = []) =>
          old.map((entry) => (entry.id === id ? { ...entry, ...input } : entry))
      );

      return { previousQueries };
    },
    onError: (err, _, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      setSnackbar({
        open: true,
        message: 'Failed to update activity',
        severity: 'error',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSnackbar({
        open: true,
        message: 'Activity updated successfully',
        severity: 'success',
      });
    },
  });

  return {
    ...mutation,
    snackbar,
    closeSnackbar: () => setSnackbar({ ...snackbar, open: false }),
  };
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const mutation = useMutation({
    mutationFn: deleteActivity,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['activity'] });
      const previousQueries = queryClient.getQueriesData({
        queryKey: ['activity'],
      });

      queryClient.setQueriesData<ActivityEntry[]>(
        { queryKey: ['activity'] },
        (old = []) => old.filter((entry) => entry.id !== id)
      );

      return { previousQueries };
    },
    onError: (err, _, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      setSnackbar({
        open: true,
        message: 'Failed to delete activity',
        severity: 'error',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSnackbar({
        open: true,
        message: 'Activity deleted successfully',
        severity: 'success',
      });
    },
  });

  return {
    ...mutation,
    snackbar,
    closeSnackbar: () => setSnackbar({ ...snackbar, open: false }),
  };
}
