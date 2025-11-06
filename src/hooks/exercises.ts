import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useExercises(q?: string, bodyPart?: string, includeCustom = true) {
  return useQuery({
    queryKey: ['exercises', { q, bodyPart, includeCustom }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (bodyPart) params.set('bodyPart', bodyPart);
      if (!includeCustom) params.set('includeCustom', 'false');
      const res = await fetch(`/api/exercises?${params.toString()}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load exercises');
      return res.json() as Promise<{ catalog: any[]; custom: any[] }>;
    },
    staleTime: 10 * 60_000,
  });
}

export function useCreateCustomExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; bodyPart?: string; equipment?: string; mediaUrl?: string }) => {
      const res = await fetch(`/api/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create exercise');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}
