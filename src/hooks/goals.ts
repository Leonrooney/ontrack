'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Goal, GoalsResponse, GoalInput } from '@/types/goals';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

async function fetchGoals(): Promise<Goal[]> {
  const data: GoalsResponse = await apiGet('/api/goals');
  return data.goals;
}

async function createGoal(input: GoalInput): Promise<Goal> {
  return apiPost<Goal>('/api/goals', input);
}

async function updateGoal(
  id: string,
  input: Partial<GoalInput>
): Promise<Goal> {
  return apiPatch<Goal>(`/api/goals/${id}`, input);
}

async function deleteGoal(id: string): Promise<void> {
  await apiDelete(`/api/goals/${id}`);
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const mutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSnackbar({
        open: true,
        message: 'Goal created successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to create goal',
        severity: 'error',
      });
    },
  });

  return {
    ...mutation,
    snackbar,
    closeSnackbar: () => setSnackbar({ ...snackbar, open: false }),
  };
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<GoalInput> }) =>
      updateGoal(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSnackbar({
        open: true,
        message: 'Goal updated successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to update goal',
        severity: 'error',
      });
    },
  });

  return {
    ...mutation,
    snackbar,
    closeSnackbar: () => setSnackbar({ ...snackbar, open: false }),
  };
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const mutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSnackbar({
        open: true,
        message: 'Goal deleted successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to delete goal',
        severity: 'error',
      });
    },
  });

  return {
    ...mutation,
    snackbar,
    closeSnackbar: () => setSnackbar({ ...snackbar, open: false }),
  };
}
