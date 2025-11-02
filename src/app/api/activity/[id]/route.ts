import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { activitySchema } from '@/lib/validators';

const prisma = new PrismaClient();

/**
 * PATCH /api/activity/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // Make all fields optional for update
    const partialSchema = activitySchema.partial();
    const validated = partialSchema.parse(body);

    // Check ownership
    const existing = await prisma.activityEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update
    const entry = await prisma.activityEntry.update({
      where: { id },
      data: {
        ...(validated.date && { date: new Date(validated.date) }),
        ...(validated.steps !== undefined && { steps: validated.steps }),
        ...(validated.distanceKm !== undefined && { distanceKm: validated.distanceKm }),
        ...(validated.calories !== undefined && { calories: validated.calories }),
        ...(validated.heartRateAvg !== undefined && { heartRateAvg: validated.heartRateAvg }),
        ...(validated.workouts !== undefined && { workouts: validated.workouts }),
      },
    });

    return NextResponse.json({
      id: entry.id,
      date: entry.date.toISOString(),
      steps: entry.steps,
      distanceKm: entry.distanceKm,
      calories: entry.calories,
      heartRateAvg: entry.heartRateAvg,
      workouts: entry.workouts,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/activity/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check ownership
    const existing = await prisma.activityEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete
    await prisma.activityEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}

