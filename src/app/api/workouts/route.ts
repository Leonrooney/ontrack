import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionSafe } from '@/lib/auth';
import { z } from 'zod';
import { toPlain } from '@/lib/serialize';
import {
  detectPersonalBests,
  storePersonalBests,
  getPersonalBestSetIds,
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

const CreateWorkoutSchema = z.object({
  date: z.string().datetime().optional(),
  title: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(ItemSchema).min(1),
});

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
  const limit = Number(url.searchParams.get('limit') ?? 20);
  const cursor = url.searchParams.get('cursor') ?? undefined;

  const sessions = await prisma.workout_sessions.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      workout_items: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercises: {
            select: { id: true, name: true, mediaUrl: true },
          },
          custom_exercises: {
            select: { id: true, name: true, mediaUrl: true },
          },
          workout_sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  });

  const hasMore = sessions.length > limit;
  const sessionsToReturn = hasMore ? sessions.slice(0, -1) : sessions;
  const workoutIds = sessionsToReturn.map((s) => s.id);

  // Get all PB set IDs for these workouts
  const pbSetIds = await getPersonalBestSetIds(user.id, workoutIds);

  // Add isPersonalBest flag to each set
  const data = sessionsToReturn.map((session) => {
    const plain: any = toPlain(session);
    // Map workout_items to items for API compatibility
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
    return plain;
  });

  const nextCursor = hasMore ? sessions[sessions.length - 1].id : null;

  return NextResponse.json({ items: data, nextCursor });
}

export async function POST(req: Request) {
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

  const json = await req.json();
  const parsed = CreateWorkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { date, title, notes, items } = parsed.data;

  const created = await prisma.workout_sessions.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      date: date ? new Date(date) : new Date(),
      title,
      notes,
      workout_items: {
        create: items.map((it, idx) => ({
          id: randomUUID(),
          orderIndex: idx,
          exerciseId: 'exerciseId' in it ? it.exerciseId : null,
          customId: 'customId' in it ? it.customId : null,
          workout_sets: {
            create: it.sets.map((s) => ({
              id: randomUUID(),
              setNumber: s.setNumber,
              weightKg: s.weightKg != null ? s.weightKg : null,
              reps: s.reps,
              rpe: s.rpe != null ? s.rpe : null,
              notes: s.notes,
            })),
          },
        })),
      },
    },
    include: {
      workout_items: {
        include: {
          exercises: {
            select: { id: true, name: true, mediaUrl: true },
          },
          custom_exercises: {
            select: { id: true, name: true, mediaUrl: true },
          },
          workout_sets: true,
        },
      },
    },
  });

  // Detect and store personal bests for all sets
  for (const item of created.workout_items) {
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

  // Map workout_items to items for API compatibility
  const response: any = toPlain(created);
  if (response.workout_items) {
    response.items = response.workout_items.map((item: any) => {
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
      return mappedItem;
    });
    delete response.workout_items;
  }

  return NextResponse.json(response, { status: 201 });
}
