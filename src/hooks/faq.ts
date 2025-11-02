import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  slug: string;
}

export interface FaqResponse {
  items: FaqItem[];
}

export function useFaq(query: string, tag?: string) {
  return useQuery({
    queryKey: ['faq', { query, tag }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (tag) params.set('tag', tag);
      return apiGet<FaqResponse>(`/api/faq?${params.toString()}`);
    },
    staleTime: 5 * 60_000,
  });
}

