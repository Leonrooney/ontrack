import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateRoutineSchema } from '@/lib/validators';
import { toPlain } from '@/lib/serialize';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

async function toRoutineResponse(routine: any) {
  const p: any = toPlain(routine);
  if (p.routine_items) {
    p.items = p.routine_items.map((item: any) => ({
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
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const routine = await prisma.routines.findUnique({
    where: { id: params.id },
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

  if (!routine) return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
  if (routine.userId !== auth.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(await toRoutineResponse(routine));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.routines.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!existing) return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
  if (existing.userId !== auth.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const json = await req.json();
  const parsed = updateRoutineSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, items } = parsed.data;

  if (items !== undefined) {
    await prisma.routine_items.deleteMany({ where: { routineId: params.id } });
    await prisma.routine_items.createMany({
      data: items.map((it, idx) => ({
        id: randomUUID(),
        routineId: params.id,
        orderIndex: idx,
        exerciseId: 'exerciseId' in it ? it.exerciseId : null,
        customId: 'customId' in it ? it.customId : null,
        setCount: it.setCount,
      })),
    });
  }

  const routine = await prisma.routines.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      updatedAt: new Date(),
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

  return NextResponse.json(await toRoutineResponse(routine));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.routines.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!existing) return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
  if (existing.userId !== auth.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.routines.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
