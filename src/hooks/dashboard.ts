'use client';

import { useQuery } from '@tanstack/react-query';

export interface DashboardSummary {
  totalSteps: number;
  totalDistanceKm: number;
  totalCalories: number;
  totalWorkouts: number;
  avgHeartRate: number | null;
  goalCompletionRate: number;
  activeGoalsCount: number;
}

export interface DashboardTrends {
  labels: string[];
  steps: number[];
  calories: number[];
  distanceKm: number[];
}

export interface DashboardData {
  summary: DashboardSummary;
  trends: DashboardTrends;
  recommendations: string[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch('/api/dashboard');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard');
  }
  return response.json();
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

