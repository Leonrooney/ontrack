export interface ActivityEntry {
  id: string;
  date: string; // ISO string
  steps: number;
  distanceKm: number;
  calories: number;
  heartRateAvg: number | null;
  workouts: number;
}

export interface ActivityResponse {
  entries: ActivityEntry[];
}

export interface ActivityInput {
  date: string;
  steps: number;
  distanceKm: number;
  calories: number;
  heartRateAvg?: number;
  workouts: number;
}

export type DateRange = 'day' | 'week' | 'month';
