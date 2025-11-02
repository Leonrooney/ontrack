import { NextRequest, NextResponse } from 'next/server';
import { getSessionSafe } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sumActivityForRange } from '@/lib/aggregate';
import { subDays, format, startOfDay } from 'date-fns';
import { generateRecommendations } from '@/lib/recommendations';
import { toPlain, toNumber } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard
 * Returns dashboard summary, trends, and recommendations
 */
export async function GET(request: NextRequest) {
  const session = await getSessionSafe();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const today = new Date();
    const fourteenDaysAgo = subDays(today, 13); // Last 14 days (today + 13 days back)

    // Get summary for last 30 days
    const thirtyDaysAgo = subDays(today, 29);
    const last30Days = await sumActivityForRange(userId, {
      start: thirtyDaysAgo,
      end: today,
    });

    // Get trends for last 14 days
    const trends = {
      labels: [] as string[],
      steps: [] as number[],
      calories: [] as number[],
      distanceKm: [] as number[],
    };

    for (let i = 13; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayData = await sumActivityForRange(userId, {
        start: dayStart,
        end: dayEnd,
      });

      trends.labels.push(format(date, 'MMM d'));
      trends.steps.push(dayData.steps);
      trends.calories.push(dayData.calories);
      trends.distanceKm.push(toNumber(dayData.distanceKm) || 0);
    }

    // Calculate average heart rate
    const activityEntries = await prisma.activityEntry.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo,
        },
        heartRateAvg: {
          not: null,
        },
      },
      select: {
        heartRateAvg: true,
      },
    });

    const avgHeartRate =
      activityEntries.length > 0
        ? activityEntries.reduce((sum, e) => sum + (e.heartRateAvg || 0), 0) /
          activityEntries.length
        : null;

    // Get goals and calculate completion rate
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const activeGoalsCount = goals.length;
    let metGoalsCount = 0;

    // Check each goal's progress for current period
    for (const goal of goals) {
      if (!goal.type || !goal.period) continue;

      const { getPeriodBounds } = await import('@/lib/period');
      const bounds = getPeriodBounds(goal.period as any, today);
      const aggregate = await sumActivityForRange(userId, bounds);

      let target: number;
      let current: number;

      switch (goal.type) {
        case 'STEPS':
          target = goal.targetInt || 0;
          current = aggregate.steps;
          break;
        case 'WORKOUTS':
          target = goal.targetInt || 0;
          current = aggregate.workouts;
          break;
        case 'DISTANCE':
          target = toNumber(goal.targetDec) || 0;
          current = toNumber(aggregate.distanceKm) || 0;
          break;
        case 'CALORIES':
          target = toNumber(goal.targetDec) || 0;
          current = aggregate.calories;
          break;
        default:
          target = 0;
          current = 0;
      }

      const pct = target > 0 ? (current / target) * 100 : 0;
      if (pct >= 100) {
        metGoalsCount++;
      }
    }

    const goalCompletionRate =
      activeGoalsCount > 0 ? (metGoalsCount / activeGoalsCount) * 100 : 0;

    // Generate recommendations
    const recommendations = await generateRecommendations(
      userId,
      last30Days,
      trends,
      goals,
      avgHeartRate
    );

    return NextResponse.json(
      toPlain({
        summary: {
          totalSteps: last30Days.steps,
          totalDistanceKm: toNumber(last30Days.distanceKm) || 0,
          totalCalories: last30Days.calories,
          totalWorkouts: last30Days.workouts,
          avgHeartRate: avgHeartRate ? Math.round(avgHeartRate) : null,
          goalCompletionRate: Math.round(goalCompletionRate * 10) / 10,
          activeGoalsCount,
        },
        trends,
        recommendations,
      })
    );
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

