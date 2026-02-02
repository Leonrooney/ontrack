import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionSafe } from '@/lib/auth';
import { z } from 'zod';
import { toPlain } from '@/lib/serialize';
import {
  getPersonalBestSetIds,
  detectPersonalBests,
  storePersonalBests,
} from '@/lib/personal-best';
import { randomUUID } from 'crypto';

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

  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workout = await prisma.workout_sessions.findUnique({
    where: { id: params.id },
    include: {
      workout_items: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercises: true,
          custom_exercises: true,
          workout_sets: { orderBy: { setNumber: 'asc' } },
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
  const plain: any = toPlain(workout);
  if (plain.workout_items) {
    plain.items = plain.workout_items.map((item: any) => {
      // Map exercises/custom_exercises to exercise/custom for frontend compatibility
      // Map workout_sets to sets for frontend compatibility
      const mappedItem: any = {
        ...item,
        exercise: item.exercises || null,
        custom: item.custom_exercises || null,
        sets: item.workout_sets || [],
      };
      delete mappedItem.exercises;
      delete mappedItem.custom_exercises;
      delete mappedItem.workout_sets;

      if (mappedItem.sets) {
        mappedItem.sets = mappedItem.sets.map((set: any) => ({
          ...set,
          isPersonalBest: pbSetIds.has(set.id),
        }));
      }
      return mappedItem;
    });
    delete plain.workout_items;
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

  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check ownership first
  const existing = await prisma.workout_sessions.findUnique({
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
    await prisma.workout_items.deleteMany({
      where: { workoutId: params.id },
    });

    // Create new items
    await prisma.workout_items.createMany({
      data: items.map((it, idx) => ({
        id: randomUUID(),
        workoutId: params.id,
        orderIndex: idx,
        exerciseId: 'exerciseId' in it ? it.exerciseId : null,
        customId: 'customId' in it ? it.customId : null,
      })),
    });

    // Get the created items to create sets
    const createdItems = await prisma.workout_items.findMany({
      where: { workoutId: params.id },
      orderBy: { orderIndex: 'asc' },
    });

    // Create sets for each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const createdItem = createdItems[i];
      if (createdItem) {
        await prisma.workout_sets.createMany({
          data: item.sets.map((s: any) => ({
            id: randomUUID(),
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

  const updated = await prisma.workout_sessions.update({
    where: { id: params.id },
    data: updateData,
    include: {
      workout_items: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercises: true,
          custom_exercises: true,
          workout_sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  });

  // If items were updated, detect and store new PBs
  if (items !== undefined) {
    for (const item of updated.workout_items) {
      const exerciseId = item.exerciseId;
      const customId = item.customId;

      for (const set of item.workout_sets) {
        const pbs = await detectPersonalBests(
          user.id,
          exerciseId,
          customId,
          set.id,
          set.weightKg ? Number(set.weightKg) : null,
          set.reps
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
  const plain: any = toPlain(updated);
  if (plain.workout_items) {
    plain.items = plain.workout_items.map((item: any) => {
      // Map exercises/custom_exercises to exercise/custom for frontend compatibility
      // Map workout_sets to sets for frontend compatibility
      const mappedItem: any = {
        ...item,
        exercise: item.exercises || null,
        custom: item.custom_exercises || null,
        sets: item.workout_sets || [],
      };
      delete mappedItem.exercises;
      delete mappedItem.custom_exercises;
      delete mappedItem.workout_sets;

      if (mappedItem.sets) {
        mappedItem.sets = mappedItem.sets.map((set: any) => ({
          ...set,
          isPersonalBest: pbSetIds.has(set.id),
        }));
      }
      return mappedItem;
    });
    delete plain.workout_items;
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

  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check ownership
  const existing = await prisma.workout_sessions.findUnique({
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
  await prisma.workout_sessions.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
