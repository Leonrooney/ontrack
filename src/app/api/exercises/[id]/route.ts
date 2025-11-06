import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionSafe } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UpdateCustom = z.object({
  name: z.string().min(2).max(80).optional(),
  bodyPart: z.string().max(40).optional(),
  equipment: z.string().max(40).optional(),
  mediaUrl: z.string().url().max(300).optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await req.json();
  const parsed = UpdateCustom.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.customExercise.update({
    where: { id: params.id, userId: user.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.customExercise.delete({
    where: { id: params.id, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}

