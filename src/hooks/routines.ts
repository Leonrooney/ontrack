import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

export type RoutineItem = {
  id: string;
  exerciseId?: string | null;
  customId?: string | null;
  orderIndex: number;
  setCount: number;
  name: string;
  exercise?: { id: string; name: string; mediaUrl?: string } | null;
  custom?: { id: string; name: string; mediaUrl?: string } | null;
};

export type Routine = {
  id: string;
  name: string;
  items: RoutineItem[];
  createdAt: string;
  updatedAt: string;
};

export function useRoutines() {
  return useQuery({
    queryKey: ['routines'],
    queryFn: () => apiGet<Routine[]>('/api/routines'),
  });
}

export function useRoutine(id: string | null) {
  return useQuery({
    queryKey: ['routine', id],
    queryFn: () => apiGet<Routine>(`/api/routines/${id}`),
    enabled: !!id,
  });
}

export function useCreateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      items: Array<
        | { exerciseId: string; setCount: number }
        | { customId: string; setCount: number }
      >;
    }) => apiPost<Routine>('/api/routines', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useUpdateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        name?: string;
        items?: Array<
          | { exerciseId: string; setCount: number }
          | { customId: string; setCount: number }
        >;
      };
    }) => apiPatch<Routine>(`/api/routines/${id}`, payload),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['routines'] });
      qc.invalidateQueries({ queryKey: ['routine', v.id] });
    },
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/routines/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
}
