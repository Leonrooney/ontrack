import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionSafe } from '@/lib/auth';
import { z } from 'zod';
import { toPlain } from '@/lib/serialize';
import { getPersonalBestSetIds, detectPersonalBests, storePersonalBests } from '@/lib/personal-best';

export const dynamic = 'force-dynamic';

const SetSchema = z.object({
  setNumber: z.number().int().min(1),
  weightKg: z.number().nonnegative().optional(),
  reps: z.number().int().min(1).max(100),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().max(200).optional(),
});

const ItemSchema = z.union([
  z.object({
    exerciseId: z.string().min(1),
    sets: z.array(SetSchema).min(1),
  }),
  z.object({
    customId: z.string().min(1),
    sets: z.array(SetSchema).min(1),
  }),
]);

const UpdateWorkoutSchema = z.object({
  date: z.string().datetime().optional(),
  title: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(ItemSchema).min(1).optional(),
});

/**
 * GET /api/workouts/[id]
 * Returns a single workout session by id, including items and sets
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workout = await prisma.workoutSession.findUnique({
    where: { id: params.id },
    include: {
      items: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercise: true,
          custom: true,
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  });

  if (!workout) {
    return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
  }

  // Enforce ownership
  if (workout.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get PB set IDs for this workout
  const pbSetIds = await getPersonalBestSetIds(user.id, [workout.id]);

  // Add isPersonalBest flag to each set
  const plain = toPlain(workout);
  if (plain.items) {
    plain.items = plain.items.map((item: any) => {
      if (item.sets) {
        item.sets = item.sets.map((set: any) => ({
          ...set,
          isPersonalBest: pbSetIds.has(set.id),
        }));
      }
      return item;
    });
  }

  return NextResponse.json(plain);
}

/**
 * PATCH /api/workouts/[id]
 * Updates an existing workout session for the current user
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check ownership first
  const existing = await prisma.workoutSession.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
  }

  if (existing.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const json = await req.json();
  const parsed = UpdateWorkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { date, title, notes, items } = parsed.data;

  // If items are provided, we need to replace all items and sets
  if (items !== undefined) {
    // Delete existing items (cascades to sets)
    await prisma.workoutItem.deleteMany({
      where: { workoutId: params.id },
    });

    // Create new items
    await prisma.workoutItem.createMany({
      data: items.map((it, idx) => ({
        workoutId: params.id,
        orderIndex: idx,
        exerciseId: 'exerciseId' in it ? it.exerciseId : null,
        customId: 'customId' in it ? it.customId : null,
      })),
    });

    // Get the created items to create sets
    const createdItems = await prisma.workoutItem.findMany({
      where: { workoutId: params.id },
      orderBy: { orderIndex: 'asc' },
    });

    // Create sets for each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const createdItem = createdItems[i];
      if (createdItem) {
        await prisma.workoutSet.createMany({
          data: item.sets.map((s) => ({
            itemId: createdItem.id,
            setNumber: s.setNumber,
            weightKg: s.weightKg != null ? s.weightKg : null,
            reps: s.reps,
            rpe: s.rpe != null ? s.rpe : null,
            notes: s.notes,
          })),
        });
      }
    }
  }

  // Update workout session fields
  const updateData: {
    date?: Date;
    title?: string | null;
    notes?: string | null;
  } = {};

  if (date !== undefined) {
    updateData.date = new Date(date);
  }
  if (title !== undefined) {
    updateData.title = title || null;
  }
  if (notes !== undefined) {
    updateData.notes = notes || null;
  }

  const updated = await prisma.workoutSession.update({
    where: { id: params.id },
    data: updateData,
    include: {
      items: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercise: true,
          custom: true,
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  });

  // If items were updated, detect and store new PBs
  if (items !== undefined) {
    for (const item of updated.items) {
      const exerciseId = item.exerciseId;
      const customId = item.customId;

      for (const set of item.sets) {
        const pbs = await detectPersonalBests(
          user.id,
          exerciseId,
          customId,
          set.id,
          set.weightKg ? Number(set.weightKg) : null,
          set.reps,
        );

        if (pbs.length > 0) {
          await storePersonalBests(user.id, exerciseId, customId, pbs);
        }
      }
    }
  }

  // Get PB set IDs for this workout
  const pbSetIds = await getPersonalBestSetIds(user.id, [updated.id]);

  // Add isPersonalBest flag to each set
  const plain = toPlain(updated);
  if (plain.items) {
    plain.items = plain.items.map((item: any) => {
      if (item.sets) {
        item.sets = item.sets.map((set: any) => ({
          ...set,
          isPersonalBest: pbSetIds.has(set.id),
        }));
      }
      return item;
    });
  }

  return NextResponse.json(plain);
}

/**
 * DELETE /api/workouts/[id]
 * Deletes the workout session and its related items/sets
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check ownership
  const existing = await prisma.workoutSession.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
  }

  if (existing.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete workout (cascades to items and sets)
  await prisma.workoutSession.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}



