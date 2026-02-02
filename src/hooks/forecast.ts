import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export type ForecastMetric = 'steps' | 'calories' | 'distance';
export type ForecastMethod = 'ma' | 'es';

export interface ForecastResponse {
  metric: ForecastMetric;
  method: ForecastMethod;
  horizon: number;
  history: Array<{
    date: string;
    actual?: number;
    predicted: number;
    lower?: number;
    upper?: number;
  }>;
  future: Array<{
    date: string;
    predicted: number;
    lower?: number;
    upper?: number;
  }>;
}

export function useForecast(
  metric: ForecastMetric,
  method: ForecastMethod,
  horizon: number
) {
  return useQuery({
    queryKey: ['forecast', metric, method, horizon],
    queryFn: async () => {
      const qs = new URLSearchParams({
        metric,
        method,
        horizon: String(horizon),
      });
      return apiGet<ForecastResponse>(`/api/forecast?${qs.toString()}`);
    },
    staleTime: 60_000,
  });
}
