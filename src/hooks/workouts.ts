import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

export function useWorkoutHistory(limit = 20) {
  return useQuery({
    queryKey: ['workouts', { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/workouts?limit=${limit}`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load workouts');
      return res.json() as Promise<{ items: any[]; nextCursor: string | null }>;
    },
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: async () => {
      const res = await fetch(`/api/workouts/${id}`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load workout');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      date?: string;
      title?: string;
      notes?: string;
      items: Array<{
        exerciseId?: string;
        customId?: string;
        sets: Array<{
          setNumber: number;
          weightKg?: number;
          reps: number;
          rpe?: number;
          notes?: string;
        }>;
      }>;
    }) => {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save workout');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['workouts', 'recent'] });
      qc.invalidateQueries({ queryKey: ['workouts', 'stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const mutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        date?: string;
        title?: string;
        notes?: string;
        items?: Array<{
          exerciseId?: string;
          customId?: string;
          sets: Array<{
            setNumber: number;
            weightKg?: number;
            reps: number;
            rpe?: number;
            notes?: string;
          }>;
        }>;
      };
    }) => {
      const res = await fetch(`/api/workouts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update workout');
      return res.json();
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['workout', variables.id] });
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['workouts', 'recent'] });
      qc.invalidateQueries({ queryKey: ['workouts', 'stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['goals'] });
      setSnackbar({
        open: true,
        message: 'Workout updated successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to update workout',
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

export function useDeleteWorkout() {
  const qc = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to delete workout');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['workouts', 'recent'] });
      qc.invalidateQueries({ queryKey: ['workouts', 'stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['goals'] });
      setSnackbar({
        open: true,
        message: 'Workout deleted successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to delete workout',
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

export function useRecentWorkout() {
  return useQuery({
    queryKey: ['workouts', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/workouts/recent', {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load recent workout');
      const data = await res.json();
      return data || null;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useWorkoutFrequency(range = 90) {
  return useQuery({
    queryKey: ['workouts', 'stats', { range }],
    queryFn: async () => {
      const res = await fetch(`/api/workouts/stats?range=${range}`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load workout stats');
      return res.json() as Promise<{
        stats: Array<{ week: string; weekStart: string; count: number }>;
      }>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
export function useDailyWorkoutStats(weekOffset = 0) {
  return useQuery({
    queryKey: ['workouts', 'stats', 'daily', { weekOffset }],
    queryFn: async () => {
      const res = await fetch(`/api/workouts/stats/daily?week=${weekOffset}`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load daily workout stats');
      return res.json() as Promise<{
        stats: Array<{ day: string; date: string; count: number }>;
        weekStart: string;
        weekEnd: string;
      }>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMonthlyWorkoutStats(monthOffset = 0) {
  return useQuery({
    queryKey: ['workouts', 'stats', 'monthly', { monthOffset }],
    queryFn: async () => {
      const res = await fetch(
        `/api/workouts/stats/monthly?month=${monthOffset}`,
        { credentials: 'same-origin' }
      );
      if (!res.ok) throw new Error('Failed to load monthly workout stats');
      return res.json() as Promise<{
        calendar: Array<{
          date: string;
          day: number;
          hasWorkout: boolean;
          isCurrentMonth: boolean;
        }>;
        month: string;
        monthStart: string;
        monthEnd: string;
      }>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMuscleGroupStats(range = 90) {
  return useQuery({
    queryKey: ['workouts', 'stats', 'muscle-groups', { range }],
    queryFn: async () => {
      const res = await fetch(
        `/api/workouts/stats/muscle-groups?range=${range}`,
        { credentials: 'same-origin' }
      );
      if (!res.ok) throw new Error('Failed to load muscle group stats');
      return res.json() as Promise<{
        current: {
          Back: number;
          Chest: number;
          Core: number;
          Shoulders: number;
          Arms: number;
          Legs: number;
        };
        previous: {
          Back: number;
          Chest: number;
          Core: number;
          Shoulders: number;
          Arms: number;
          Legs: number;
        };
        currentRaw: {
          Back: number;
          Chest: number;
          Core: number;
          Shoulders: number;
          Arms: number;
          Legs: number;
        };
        previousRaw: {
          Back: number;
          Chest: number;
          Core: number;
          Shoulders: number;
          Arms: number;
          Legs: number;
        };
        maxValue: number;
      }>;
    },
    staleTime: 5 * 60 * 1000,
  });
}
