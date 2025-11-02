import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { getPeriodBounds, listPreviousPeriods } from '@/lib/period';
import { sumActivityForRange, computeStreak } from '@/lib/aggregate';
import { prisma } from '@/lib/prisma';
import { toPlain, toNumber } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

const goalSchema = z.object({
  type: z.enum(['STEPS', 'CALORIES', 'WORKOUTS', 'DISTANCE']),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  targetInt: z.number().min(0).optional(),
  targetDec: z.number().min(0).optional(),
  startDate: z.string().optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => {
    const intTypes = ['STEPS', 'WORKOUTS'];
    const decTypes = ['DISTANCE', 'CALORIES'];
    
    if (intTypes.includes(data.type)) {
      return data.targetInt !== undefined && data.targetDec === undefined;
    }
    if (decTypes.includes(data.type)) {
      return data.targetDec !== undefined && data.targetInt === undefined;
    }
    return false;
  },
  {
    message: 'Must provide targetInt for STEPS/WORKOUTS or targetDec for DISTANCE/CALORIES',
  }
);

/**
 * GET /api/goals
 * Returns all goals with computed progress for current period
 */
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Compute progress for each goal
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        if (!goal.type || !goal.period) {
          return {
            ...goal,
            progress: null,
          };
        }

        const bounds = getPeriodBounds(goal.period as any, new Date());
        const aggregate = await sumActivityForRange(session.user!.id, bounds);
        
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
            target = goal.targetDec || 0;
            current = aggregate.distanceKm;
            break;
          case 'CALORIES':
            target = goal.targetDec || 0;
            current = aggregate.calories;
            break;
          default:
            target = 0;
            current = 0;
        }

        const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
        const isMetThisPeriod = pct >= 100;

        // Compute streak
        const recentPeriods = listPreviousPeriods(goal.period as any, 30);
        const streakCount = await computeStreak(
          {
            type: goal.type,
            period: goal.period,
            userId: session.user!.id,
            targetInt: goal.targetInt,
            targetDec: toNumber(goal.targetDec),
          },
          recentPeriods
        );

        return toPlain({
          id: goal.id,
          userId: goal.userId,
          type: goal.type,
          period: goal.period,
          targetInt: goal.targetInt ?? null,
          targetDec: toNumber(goal.targetDec),
          startDate: goal.startDate?.toISOString() ?? null,
          isActive: goal.isActive,
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
          progress: {
            currentValue: current,
            targetValue: target,
            pct: Math.round(pct * 10) / 10, // Round to 1 decimal
            streakCount,
            isMetThisPeriod,
          },
        });
      })
    );

    return NextResponse.json({ goals: goalsWithProgress });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/goals
 * Create a new goal
 */
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = goalSchema.parse(body);

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        type: validated.type,
        period: validated.period,
        targetInt: validated.targetInt,
        targetDec: validated.targetDec,
        startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
        isActive: validated.isActive ?? true,
      },
    });

    return NextResponse.json(
      toPlain({
        id: goal.id,
        userId: goal.userId,
        type: goal.type,
        period: goal.period,
        targetInt: goal.targetInt ?? null,
        targetDec: toNumber(goal.targetDec),
        startDate: goal.startDate?.toISOString() ?? null,
        isActive: goal.isActive,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

