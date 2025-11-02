import { NextRequest, NextResponse } from 'next/server';
import { getSessionSafe } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { toPlain, toNumber } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

const updateGoalSchema = z.object({
  type: z.enum(['STEPS', 'CALORIES', 'WORKOUTS', 'DISTANCE']).optional(),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  targetInt: z.number().min(0).optional(),
  targetDec: z.number().min(0).optional(),
  startDate: z.string().optional(),
  isActive: z.boolean().optional(),
}).partial();

/**
 * PATCH /api/goals/:id
 * Update a goal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionSafe();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateGoalSchema.parse(body);

    // Check ownership
    const existing = await prisma.goal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(validated.type && { type: validated.type }),
        ...(validated.period && { period: validated.period }),
        ...(validated.targetInt !== undefined && { targetInt: validated.targetInt }),
        ...(validated.targetDec !== undefined && { targetDec: validated.targetDec }),
        ...(validated.startDate && { startDate: new Date(validated.startDate) }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
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
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/goals/:id
 * Delete a goal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionSafe();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existing = await prisma.goal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete
    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}

