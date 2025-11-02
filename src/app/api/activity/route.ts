import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { activitySchema } from '@/lib/validators';
import { getRangeBounds } from '@/lib/date';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/**
 * GET /api/activity?range=day|week|month&date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || 'day';
  const dateParam = searchParams.get('date');

  // Validate range
  if (!['day', 'week', 'month'].includes(range)) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
  }

  // Parse date or use today
  let anchorDate = new Date();
  if (dateParam) {
    anchorDate = new Date(dateParam);
    if (isNaN(anchorDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
  }

  // Get date bounds
  const { start, end } = getRangeBounds(range as 'day' | 'week' | 'month', anchorDate);

  try {
    // Fetch entries
    const entries = await prisma.activityEntry.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Normalize response
    const normalized = entries.map((entry) => ({
      id: entry.id,
      date: entry.date.toISOString(),
      steps: entry.steps || 0,
      distanceKm: toNumber(entry.distanceKm) || 0,
      calories: entry.calories || 0,
      heartRateAvg: entry.heartRateAvg || null,
      workouts: entry.workouts || 0,
    }));

    return NextResponse.json({ entries: normalized });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activity
 */
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validated = activitySchema.parse(body);

    // Create activity entry
    const entry = await prisma.activityEntry.create({
      data: {
        userId: session.user.id,
        date: new Date(validated.date),
        steps: validated.steps,
        distanceKm: validated.distanceKm,
        calories: validated.calories,
        heartRateAvg: validated.heartRateAvg,
        workouts: validated.workouts,
      },
    });

    return NextResponse.json(
      {
        id: entry.id,
        date: entry.date.toISOString(),
        steps: entry.steps,
        distanceKm: toNumber(entry.distanceKm) || 0,
        calories: entry.calories,
        heartRateAvg: entry.heartRateAvg,
        workouts: entry.workouts,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

