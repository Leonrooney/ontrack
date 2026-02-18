import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Calendar day data structure for monthly view
 */
interface CalendarDay {
  date: string; // ISO date string
  day: number; // Day of month (1-31)
  hasWorkout: boolean; // Whether user worked out on this day
  isCurrentMonth: boolean; // Always true for this endpoint
  workoutTitle?: string; // Workout title or derived muscle group label
  workoutId?: string; // Workout session ID for navigation (first workout of day if multiple)
}

/**
 * GET /api/workouts/stats/monthly
 *
 * Returns calendar data for a specific month with workout indicators
 *
 * Query parameters:
 * - month: Month offset (0 = current month, -1 = last month, 1 = next month, etc.)
 *
 * Returns:
 * - calendar: Array of calendar days with workout information
 * - month: Formatted month string (e.g., "January 2025")
 * - monthStart: ISO date string of month start
 * - monthEnd: ISO date string of month end
 */
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const monthOffset = Number(url.searchParams.get('month') ?? 0); // 0 = current month, -1 = last month, etc.

  // Calculate month range
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const targetMonthStart = new Date(currentMonthStart);
  targetMonthStart.setMonth(currentMonthStart.getMonth() + monthOffset);
  const targetMonthEnd = endOfMonth(targetMonthStart);

  // Fetch all workouts in the month with their items
  const workouts = await prisma.workout_sessions.findMany({
    where: {
      userId: auth.userId,
      date: {
        gte: targetMonthStart,
        lte: targetMonthEnd,
      },
    },
    select: {
      id: true,
      date: true,
      title: true,
      workout_items: {
        include: {
          exercises: {
            select: { bodyPart: true },
          },
          custom_exercises: {
            select: { bodyPart: true },
          },
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Helper to get primary muscle group from exercises
  const getPrimaryMuscleGroup = (items: any[]): string | null => {
    const bodyPartCounts: Record<string, number> = {};

    items.forEach((item) => {
      const bodyPart =
        item.exercises?.bodyPart || item.custom_exercises?.bodyPart;
      if (bodyPart) {
        const normalized = bodyPart.trim();
        // Map to standard categories
        if (
          normalized === 'Back' ||
          normalized === 'Chest' ||
          normalized === 'Core' ||
          normalized === 'Shoulders' ||
          normalized === 'Arms' ||
          normalized === 'Legs'
        ) {
          bodyPartCounts[normalized] = (bodyPartCounts[normalized] || 0) + 1;
        }
      }
    });

    // Return the most common body part
    const entries = Object.entries(bodyPartCounts);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

  // Create map of workout dates to { workoutId, workoutTitle }
  const workoutMap = new Map<
    string,
    { workoutId: string; workoutTitle: string }
  >();
  workouts.forEach((w) => {
    const dateKey = format(w.date, 'yyyy-MM-dd');
    // Use first workout of the day (workouts ordered by date asc)
    if (!workoutMap.has(dateKey)) {
      let workoutTitle: string;
      if (w.title && w.title.trim()) {
        workoutTitle = w.title.trim();
      } else {
        const primaryMuscle = getPrimaryMuscleGroup(w.workout_items);
        workoutTitle = primaryMuscle ?? 'Workout';
      }
      workoutMap.set(dateKey, { workoutId: w.id, workoutTitle });
    }
  });

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({
    start: targetMonthStart,
    end: targetMonthEnd,
  });

  // Convert to calendar format
  const calendar: CalendarDay[] = daysInMonth.map((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const entry = workoutMap.get(dateKey);
    const hasWorkout = !!entry;
    return {
      date: dateKey,
      day: day.getDate(),
      hasWorkout,
      isCurrentMonth: true,
      workoutTitle: entry?.workoutTitle,
      workoutId: entry?.workoutId,
    };
  });

  return NextResponse.json({
    calendar,
    month: format(targetMonthStart, 'MMMM yyyy'),
    monthStart: format(targetMonthStart, 'yyyy-MM-dd'),
    monthEnd: format(targetMonthEnd, 'yyyy-MM-dd'),
  });
}
