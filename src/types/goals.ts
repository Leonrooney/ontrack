export interface GoalProgress {
  currentValue: number;
  targetValue: number;
  pct: number;
  streakCount: number;
  isMetThisPeriod: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  type: 'STEPS' | 'CALORIES' | 'WORKOUTS' | 'DISTANCE' | null;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
  targetInt: number | null;
  targetDec: number | null;
  startDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  progress: GoalProgress | null;
}

export interface GoalsResponse {
  goals: Goal[];
}

export interface GoalInput {
  type: 'STEPS' | 'CALORIES' | 'WORKOUTS' | 'DISTANCE';
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  targetInt?: number;
  targetDec?: number;
  startDate?: string;
  isActive?: boolean;
}

