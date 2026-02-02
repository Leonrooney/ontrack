import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionSafe } from '@/lib/auth';
import { toPlain } from '@/lib/serialize';
import { getPersonalBestSetIds } from '@/lib/personal-best';

export const dynamic = 'force-dynamic';

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

  const recent = await prisma.workout_sessions.findFirst({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    include: {
      workout_items: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercises: true,
          custom_exercises: true,
          workout_sets: {
            orderBy: { setNumber: 'asc' },
          },
        },
      },
    },
  });

  if (!recent) {
    return NextResponse.json(null);
  }

  // Calculate total sets
  const totalSets = recent.workout_items.reduce(
    (sum, item) => sum + item.workout_sets.length,
    0
  );

  // Get PB set IDs for this workout
  const pbSetIds = await getPersonalBestSetIds(user.id, [recent.id]);

  // Add isPersonalBest flag to each set
  const plain: any = toPlain(recent);
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

  return NextResponse.json({
    ...plain,
    totalSets,
    exerciseCount: recent.workout_items.length,
  });
}
