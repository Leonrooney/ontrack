import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface WeightEntry {
  id: string;
  userId: string;
  weightKg: number;
  loggedAt: string;
  note: string | null;
}

export function useWeightLogs(limit = 100) {
  return useQuery({
    queryKey: ['profile', 'weight', { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/profile/weight?limit=${limit}`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to load weight log');
      const json = await res.json();
      return json as { entries: WeightEntry[] };
    },
  });
}

export function useLogWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { weightKg: number; note?: string }) => {
      const res = await fetch('/api/profile/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to log weight');
      }
      return res.json() as Promise<WeightEntry>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'weight'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'tracking', 'weight'] });
    },
  });
}

export function useWeightTrackingData(limit = 365) {
  return useQuery({
    queryKey: ['profile', 'tracking', 'weight', { limit }],
    queryFn: async () => {
      const res = await fetch(
        `/api/profile/tracking/weight?limit=${limit}`,
        { credentials: 'same-origin' }
      );
      if (!res.ok) throw new Error('Failed to load weight tracking data');
      return res.json() as Promise<{ data: Array<{ date: string; weightKg: number }> }>;
    },
  });
}

export interface ExerciseTrackingPoint {
  date: string;
  label: string;
  maxWeight: number | null;
  maxReps: number | null;
}

export function useExerciseTrackingData(
  options: {
    exerciseId?: string | null;
    customId?: string | null;
    metric?: 'maxWeight' | 'maxReps';
    limit?: number;
  } | null
) {
  const { exerciseId, customId, metric = 'maxWeight', limit = 200 } = options ?? {};
  const enabled =
    (!!exerciseId || !!customId) &&
    !(exerciseId && customId);

  return useQuery({
    queryKey: [
      'profile',
      'tracking',
      'exercise',
      { exerciseId, customId, metric, limit },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (exerciseId) params.set('exerciseId', exerciseId);
      if (customId) params.set('customId', customId);
      params.set('metric', metric);
      params.set('limit', String(limit));
      const res = await fetch(
        `/api/profile/tracking/exercise?${params.toString()}`,
        { credentials: 'same-origin' }
      );
      if (!res.ok) throw new Error('Failed to load exercise tracking data');
      return res.json() as Promise<{
        data: ExerciseTrackingPoint[];
        metric: string;
      }>;
    },
    enabled,
  });
}
