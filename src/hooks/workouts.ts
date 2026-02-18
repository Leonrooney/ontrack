import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

export function useWorkoutHistory(limit = 20) {
  return useQuery({
    queryKey: ['workouts', { limit }],
    queryFn: () =>
      apiGet<{ items: any[]; nextCursor: string | null }>(
        `/api/workouts?limit=${limit}`
      ),
  });
}

export type Workout = {
  id: string;
  date: string;
  title?: string | null;
  notes?: string | null;
  items?: Array<{
    id: string;
    exerciseId?: string | null;
    customId?: string | null;
    exercise?: { id: string; name: string; mediaUrl?: string } | null;
    custom?: { id: string; name: string; mediaUrl?: string } | null;
    sets: Array<{
      id: string;
      setNumber: number;
      weightKg?: number | null;
      reps: number;
      rpe?: number | null;
      notes?: string | null;
      isPersonalBest?: boolean;
    }>;
  }>;
};

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => apiGet<Workout>(`/api/workouts/${id}`),
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
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
    }) => apiPost('/api/workouts', payload),
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
    }) => apiPatch(`/api/workouts/${id}`, payload),
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
    mutationFn: (id: string) => apiDelete(`/api/workouts/${id}`),
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

export type RecentWorkout = {
  id: string;
  title?: string;
  date: string;
  totalSets: number;
  exerciseCount: number;
  items?: Array<{
    id: string;
    exercise?: { id: string; name: string; mediaUrl?: string } | null;
    custom?: { id: string; name: string; mediaUrl?: string } | null;
    sets?: unknown[];
  }>;
};

export function useRecentWorkout() {
  return useQuery({
    queryKey: ['workouts', 'recent'],
    queryFn: async () => {
      const data = await apiGet<RecentWorkout | null>('/api/workouts/recent');
      return data ?? null;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/** Past N weeks: one bar per week, height = workout count. For dashboard frequency chart. */
export function useWeeklyWorkoutStats(weeks = 10) {
  return useQuery({
    queryKey: ['workouts', 'stats', 'weekly', { weeks }],
    queryFn: () =>
      apiGet<{
        stats: Array<{
          weekLabel: string;
          count: number;
          weekStart: string;
          weekEnd: string;
        }>;
      }>(`/api/workouts/stats/weekly?weeks=${weeks}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMonthlyWorkoutStats(monthOffset = 0) {
  return useQuery({
    queryKey: ['workouts', 'stats', 'monthly', { monthOffset }],
    queryFn: () =>
      apiGet<{
        calendar: Array<{
          date: string;
          day: number;
          hasWorkout: boolean;
          isCurrentMonth: boolean;
        }>;
        month: string;
        monthStart: string;
        monthEnd: string;
      }>(`/api/workouts/stats/monthly?month=${monthOffset}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMuscleGroupStats(range = 90) {
  return useQuery({
    queryKey: ['workouts', 'stats', 'muscle-groups', { range }],
    queryFn: () =>
      apiGet<{
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
      }>(`/api/workouts/stats/muscle-groups?range=${range}`),
    staleTime: 5 * 60 * 1000,
  });
}
