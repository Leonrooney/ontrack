import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

export function useExercises(
  q?: string,
  bodyPart?: string,
  includeCustom = true
) {
  return useQuery({
    queryKey: ['exercises', { q, bodyPart, includeCustom }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (bodyPart) params.set('bodyPart', bodyPart);
      if (!includeCustom) params.set('includeCustom', 'false');
      return apiGet<{ catalog: any[]; custom: any[] }>(
        `/api/exercises?${params.toString()}`
      );
    },
    staleTime: 10 * 60_000,
  });
}

export type CustomExerciseCreated = {
  id: string;
  name: string;
  bodyPart?: string | null;
  equipment?: string | null;
  mediaUrl?: string | null;
};

export function useCreateCustomExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      bodyPart?: string;
      equipment?: string;
      mediaUrl?: string;
    }) => apiPost<CustomExerciseCreated>('/api/exercises', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

/**
 * Map of exercise name -> mediaUrl for displaying thumbnails.
 * Use when workout API may omit mediaUrl - e.g. in dashboard recent workout or workouts list.
 */
export function useExerciseMediaMap() {
  const { data } = useExercises('', 'all');
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const ex of [...(data?.catalog ?? []), ...(data?.custom ?? [])]) {
      if (ex.name && ex.mediaUrl) map.set(ex.name, ex.mediaUrl);
    }
    return map;
  }, [data]);
}
