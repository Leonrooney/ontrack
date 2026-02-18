import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Daily workout statistics for a specific week
 */
interface DailyStat {
  day: string; // Day label like "Mon"
  date: string; // ISO date string
  count: number; // Number of workouts on this day
}

/**
 * GET /api/workouts/stats/daily
 *
 * Returns daily workout counts for a specific week
 *
 * Query parameters:
 * - week: Week offset (0 = current week, -1 = last week, 1 = next week, etc.)
 *
 * Returns:
 * - stats: Array of daily statistics with day label, date, and workout count
 * - weekStart: ISO date string of week start (Monday)
 * - weekEnd: ISO date string of week end (Sunday)
 */
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const weekOffset = Number(url.searchParams.get('week') ?? 0); // 0 = current week, -1 = last week, etc.

  // Calculate week range
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const targetWeekStart = new Date(weekStart);
  targetWeekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 });

  // Fetch all workouts in the week
  const workouts = await prisma.workout_sessions.findMany({
    where: {
      userId: auth.userId,
      date: {
        gte: targetWeekStart,
        lte: targetWeekEnd,
      },
    },
    select: {
      date: true,
    },
    orderBy: { date: 'asc' },
  });

  // Get all days in the week
  const daysInWeek = eachDayOfInterval({
    start: targetWeekStart,
    end: targetWeekEnd,
  });

  // Initialize all days with 0
  const dayMap = new Map<string, number>();
  daysInWeek.forEach((day) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    dayMap.set(dayKey, 0);
  });

  // Count workouts per day
  workouts.forEach((workout) => {
    const dayKey = format(workout.date, 'yyyy-MM-dd');
    if (dayMap.has(dayKey)) {
      const current = dayMap.get(dayKey) || 0;
      dayMap.set(dayKey, current + 1);
    }
  });

  // Convert to array and format
  const stats: DailyStat[] = Array.from(dayMap.entries())
    .map(([date, count]) => {
      const dayDate = new Date(date);
      return {
        day: format(dayDate, 'EEE'), // Mon, Tue, etc.
        date,
        count,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    stats,
    weekStart: format(targetWeekStart, 'yyyy-MM-dd'),
    weekEnd: format(targetWeekEnd, 'yyyy-MM-dd'),
  });
}
