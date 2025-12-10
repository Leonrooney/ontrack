import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionSafe } from '@/lib/auth';
import { toPlain } from '@/lib/serialize';
import { getPersonalBestSetIds } from '@/lib/personal-best';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const recent = await prisma.workoutSession.findFirst({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    include: {
      items: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercise: true,
          custom: true,
          sets: {
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
  const totalSets = recent.items.reduce((sum, item) => sum + item.sets.length, 0);

  // Get PB set IDs for this workout
  const pbSetIds = await getPersonalBestSetIds(user.id, [recent.id]);

  // Add isPersonalBest flag to each set
  const plain = toPlain(recent);
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

  return NextResponse.json({
    ...plain,
    totalSets,
    exerciseCount: recent.items.length,
  });
}

