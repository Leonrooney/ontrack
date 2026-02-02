import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionSafe } from '@/lib/auth';
import { startOfWeek, subDays, format, parseISO, addWeeks } from 'date-fns';

export const dynamic = 'force-dynamic';

interface WeeklyStat {
  week: string; // Week label like "Nov 4"
  weekStart: string; // ISO date string
  count: number;
}

export async function GET(req: Request) {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const rangeDays = Number(url.searchParams.get('range') ?? 90);
  const weeksToShow = Math.ceil(rangeDays / 7); // Calculate weeks from range

  // Calculate date range
  const endDate = new Date();
  const startDate = subDays(endDate, rangeDays);

  // Fetch all workouts in the range
  const workouts = await prisma.workout_sessions.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
    },
    orderBy: { date: 'asc' },
  });

  // Group workouts by week
  const weekMap = new Map<string, number>();

  // Initialize all weeks in range with 0
  // Start from the week containing startDate and go forward
  const firstWeekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
  const lastWeekStart = startOfWeek(endDate, { weekStartsOn: 1 });

  let currentWeek = new Date(firstWeekStart);
  while (currentWeek <= lastWeekStart) {
    const weekKey = format(currentWeek, 'yyyy-MM-dd');
    weekMap.set(weekKey, 0);
    currentWeek = addWeeks(currentWeek, 1);
  }

  // Count workouts per week
  workouts.forEach((workout) => {
    const weekStart = startOfWeek(workout.date, { weekStartsOn: 1 });
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    if (weekMap.has(weekKey)) {
      const current = weekMap.get(weekKey) || 0;
      weekMap.set(weekKey, current + 1);
    }
  });

  // Convert to array and format
  const stats: WeeklyStat[] = Array.from(weekMap.entries())
    .map(([weekStart, count]) => {
      const weekDate = parseISO(weekStart);
      return {
        week: format(weekDate, 'MMM d'),
        weekStart,
        count,
      };
    })
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return NextResponse.json({ stats });
}
