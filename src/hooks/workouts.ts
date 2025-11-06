import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useWorkoutHistory(limit = 20) {
  return useQuery({
    queryKey: ['workouts', { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/workouts?limit=${limit}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load workouts');
      return res.json() as Promise<{ items: any[]; nextCursor: string | null }>;
    },
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
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

