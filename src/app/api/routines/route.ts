import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRoutineSchema } from '@/lib/validators';
import { toPlain } from '@/lib/serialize';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const routines = await prisma.routines.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      routine_items: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercises: { select: { id: true, name: true, mediaUrl: true } },
          custom_exercises: { select: { id: true, name: true, mediaUrl: true } },
        },
      },
    },
  });

  const plain = routines.map((r) => {
    const p: Record<string, unknown> = toPlain(r) as Record<string, unknown>;
    if (p.routine_items) {
      p.items = (p.routine_items as any[]).map((item: any) => ({
        id: item.id,
        exerciseId: item.exerciseId,
        customId: item.customId,
        orderIndex: item.orderIndex,
        setCount: item.setCount,
        name: item.exercises?.name ?? item.custom_exercises?.name ?? 'Exercise',
        exercise: item.exercises ?? null,
        custom: item.custom_exercises ?? null,
      }));
      delete p.routine_items;
    }
    return p;
  });

  return NextResponse.json(plain);
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await req.json();
  const parsed = createRoutineSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, items } = parsed.data;

  const routine = await prisma.routines.create({
    data: {
      id: randomUUID(),
      userId: auth.userId,
      name,
      updatedAt: new Date(),
      routine_items: {
        create: items.map((it, idx) => ({
          id: randomUUID(),
          orderIndex: idx,
          exerciseId: 'exerciseId' in it ? it.exerciseId : null,
          customId: 'customId' in it ? it.customId : null,
          setCount: it.setCount,
        })),
      },
    },
    include: {
      routine_items: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercises: { select: { id: true, name: true, mediaUrl: true } },
          custom_exercises: { select: { id: true, name: true, mediaUrl: true } },
        },
      },
    },
  });

  const p: Record<string, unknown> = toPlain(routine) as Record<string, unknown>;
  if (p.routine_items) {
    p.items = (p.routine_items as any[]).map((item: any) => ({
      id: item.id,
      exerciseId: item.exerciseId,
      customId: item.customId,
      orderIndex: item.orderIndex,
      setCount: item.setCount,
      name: item.exercises?.name ?? item.custom_exercises?.name ?? 'Exercise',
      exercise: item.exercises ?? null,
      custom: item.custom_exercises ?? null,
    }));
    delete p.routine_items;
  }
  return NextResponse.json(p, { status: 201 });
}
