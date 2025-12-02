import { ActivityAggregate, sumActivityForRange } from './aggregate';
import { getPeriodBounds } from './period';

export interface Trends {
  labels: string[];
  steps: number[];
  calories: number[];
  distanceKm: number[];
}

export interface Goal {
  id: string;
  type: string | null;
  period: string | null;
  targetInt: number | null;
  targetDec: number | null;
  userId: string;
}

/**
 * Generate personalized recommendations based on user data
 */
export async function generateRecommendations(
  userId: string,
  last30Days: ActivityAggregate,
  trends: Trends,
  goals: Goal[],
  avgHeartRate: number | null
): Promise<string[]> {
  const recommendations: string[] = [];

  // Calculate trend changes (comparing first 7 days vs last 7 days)
  const firstWeekSteps = trends.steps.slice(0, 7).reduce((a, b) => a + b, 0);
  const lastWeekSteps = trends.steps.slice(-7).reduce((a, b) => a + b, 0);
  const stepsChange =
    firstWeekSteps > 0 ? ((lastWeekSteps - firstWeekSteps) / firstWeekSteps) * 100 : 0;

  const firstWeekCalories = trends.calories.slice(0, 7).reduce((a, b) => a + b, 0);
  const lastWeekCalories = trends.calories.slice(-7).reduce((a, b) => a + b, 0);
  const caloriesChange =
    firstWeekCalories > 0
      ? ((lastWeekCalories - firstWeekCalories) / firstWeekCalories) * 100
      : 0;

  // Check goals progress
  const today = new Date();
  for (const goal of goals) {
    if (!goal.type || !goal.period) continue;

    const bounds = getPeriodBounds(goal.period as any, today);
    const aggregate = await sumActivityForRange(userId, bounds);

    let target: number;
    let current: number;
    let label: string;

    switch (goal.type) {
      case 'STEPS':
        target = goal.targetInt || 0;
        current = aggregate.steps;
        label = 'steps';
        break;
      case 'WORKOUTS':
        target = goal.targetInt || 0;
        current = aggregate.workouts;
        label = 'workouts';
        break;
      case 'DISTANCE':
        target = goal.targetDec || 0;
        current = aggregate.distanceKm;
        label = 'km';
        break;
      case 'CALORIES':
        target = goal.targetDec || 0;
        current = aggregate.calories;
        label = 'calories';
        break;
      default:
        continue;
    }

    const pct = target > 0 ? (current / target) * 100 : 0;
    const remaining = Math.max(0, target - current);

    if (pct >= 100) {
      const periodLabel = goal.period?.toLowerCase() || 'period';
      recommendations.push(
        `Great job! You've met your ${periodLabel} ${goal.type.toLowerCase()} goal!`
      );
    } else if (pct >= 80) {
      const remainingFormatted =
        goal.type === 'STEPS' || goal.type === 'WORKOUTS'
          ? Math.round(remaining)
          : remaining.toFixed(1);
      recommendations.push(
        `You're close to your ${goal.period?.toLowerCase()} ${goal.type.toLowerCase()} goal—only ${remainingFormatted} ${label} left!`
      );
    } else if (pct < 50 && remaining > 0) {
      const remainingFormatted =
        goal.type === 'STEPS' || goal.type === 'WORKOUTS'
          ? Math.round(remaining)
          : remaining.toFixed(1);
      recommendations.push(
        `Keep pushing! You need ${remainingFormatted} more ${label} to reach your ${goal.period?.toLowerCase()} goal.`
      );
    }
  }

  // Trend-based recommendations
  if (stepsChange > 10) {
      recommendations.push(
        `Excellent progress! Your steps have increased ${Math.round(stepsChange)}% over the last week.`
      );
  } else if (stepsChange < -10) {
      recommendations.push(
        `Your step count has decreased. Try adding a daily walk to get back on track.`
      );
  }

  if (caloriesChange > 10) {
      recommendations.push(
        `Great work! Your calorie burn has increased ${Math.round(caloriesChange)}% recently.`
      );
  }

  // Heart rate recommendations
  if (avgHeartRate) {
    if (avgHeartRate < 60) {
      recommendations.push(
        `Your average heart rate is low—consider adding some cardio to improve cardiovascular health.`
      );
    } else if (avgHeartRate > 100) {
      recommendations.push(
        `Your heart rate has been elevated. Make sure to include rest days in your routine.`
      );
    }
  }

  // General recommendations
  if (last30Days.workouts === 0) {
    recommendations.push(
      `Start your fitness journey! Add your first workout to begin tracking progress.`
    );
  } else if (last30Days.workouts >= 3) {
    recommendations.push(
      `Fantastic! You've been consistent with your workouts. Keep it up!`
    );
  }

  if (last30Days.steps < 5000) {
    recommendations.push(
      `Try to reach at least 5,000 steps daily for better health.`
    );
  } else if (last30Days.steps >= 10000) {
    recommendations.push(
      `Outstanding! You're consistently hitting 10,000+ steps.`
    );
  }

  // Ensure we return 3-5 recommendations
  if (recommendations.length === 0) {
    recommendations.push(
      `Keep tracking your activities and goals to see personalized insights!`
    );
    recommendations.push(
      `Add more activity entries to get better recommendations.`
    );
  }

  return recommendations.slice(0, 5);
}

