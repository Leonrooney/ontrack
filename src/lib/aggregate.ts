import { PeriodBounds } from './period';
import { prisma } from './prisma';
import { toNumber } from './serialize';

export interface ActivityAggregate {
  steps: number;
  distanceKm: number;
  calories: number;
  workouts: number;
}

/**
 * Sum activity entries for a given date range
 */
export async function sumActivityForRange(
  userId: string,
  bounds: PeriodBounds
): Promise<ActivityAggregate> {
  const entries = await prisma.activity_entries.findMany({
    where: {
      userId,
      date: {
        gte: bounds.start,
        lte: bounds.end,
      },
    },
  });

  return {
    steps: entries.reduce((sum, e) => sum + (e.steps || 0), 0),
    distanceKm: entries.reduce(
      (sum, e) => sum + (toNumber(e.distanceKm) || 0),
      0
    ),
    calories: entries.reduce((sum, e) => sum + (e.calories || 0), 0),
    workouts: entries.reduce((sum, e) => sum + (e.workouts || 0), 0),
  };
}

/**
 * Compute streak for a goal
 */
export async function computeStreak(
  goal: {
    type: string;
    period: string;
    userId: string;
    targetInt?: number | null;
    targetDec?: number | null;
  },
  recentPeriods: PeriodBounds[]
): Promise<number> {
  let streak = 0;

  for (const periodBounds of recentPeriods.reverse()) {
    const aggregate = await sumActivityForRange(goal.userId, periodBounds);

    let target: number;
    let actual: number;

    switch (goal.type) {
      case 'STEPS':
        target = goal.targetInt || 0;
        actual = aggregate.steps;
        break;
      case 'WORKOUTS':
        target = goal.targetInt || 0;
        actual = aggregate.workouts;
        break;
      case 'DISTANCE':
        target = goal.targetDec || 0;
        actual = aggregate.distanceKm;
        break;
      case 'CALORIES':
        target = goal.targetDec || 0;
        actual = aggregate.calories;
        break;
      default:
        target = 0;
        actual = 0;
    }

    const pct = target > 0 ? (actual / target) * 100 : 0;

    if (pct >= 100) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
