import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Weekly workout count for one week
 */
interface WeeklyStat {
  weekLabel: string; // e.g. "This week", "Last week", "Mar 4"
  count: number; // Number of workouts (sessions) in that week
  weekStart: string; // ISO date (Monday)
  weekEnd: string; // ISO date (Sunday)
}

/**
 * GET /api/workouts/stats/weekly
 *
 * Returns workout count per week for the past N weeks (bars: past → current).
 *
 * Query parameters:
 * - weeks: Number of weeks to include (default 8). Current week is last bar.
 *
 * Returns:
 * - stats: Array of { weekLabel, count, weekStart, weekEnd } oldest to newest
 */
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const numWeeks = Math.min(
    Math.max(1, Number(url.searchParams.get('weeks') ?? 8)),
    24
  );

  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  const stats: WeeklyStat[] = [];

  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = subWeeks(currentWeekStart, i);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    const count = await prisma.workout_sessions.count({
      where: {
        userId: auth.userId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    let weekLabel: string;
    if (i === 0) weekLabel = 'This week';
    else if (i === 1) weekLabel = 'Last week';
    else weekLabel = format(weekStart, 'MMM d');

    stats.push({
      weekLabel,
      count,
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    });
  }

  return NextResponse.json({ stats });
}
