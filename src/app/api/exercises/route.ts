import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionSafe } from '@/lib/auth';
import { z } from 'zod';
import { placeholderForBodyPart } from '@/lib/media/enrich';

export const dynamic = 'force-dynamic';

// GET /api/exercises?q=&bodyPart=&includeCustom=true&includeInactive=false
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
  const bodyPart = (url.searchParams.get('bodyPart') ?? '').trim();
  const includeCustom = (url.searchParams.get('includeCustom') ?? 'true') === 'true';
  const includeInactive = url.searchParams.get('includeInactive') === 'true';

  const where: any = includeInactive ? {} : { isActive: true };
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (bodyPart) where.bodyPart = bodyPart;

  const catalog = await prisma.exercise.findMany({
    where,
    orderBy: [{ bodyPart: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      bodyPart: true,
      equipment: true,
      instructions: true,
      mediaUrl: true,
      isActive: true,
      createdAt: true,
    },
  });

  let custom: any[] = [];
  if (includeCustom) {
    const session = await getSessionSafe();
    const email = session?.user?.email;
    if (email) {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (user) {
        const customWhere: any = { userId: user.id, isActive: true };
        if (q) customWhere.name = { contains: q, mode: 'insensitive' };
        if (bodyPart) customWhere.bodyPart = bodyPart;
        custom = await prisma.customExercise.findMany({
          where: customWhere,
          orderBy: [{ bodyPart: 'asc' }, { name: 'asc' }],
        });
      }
    }
  }

  return NextResponse.json({ catalog, custom });
}

// POST /api/exercises (create custom)
const CreateCustom = z.object({
  name: z.string().min(2).max(80),
  bodyPart: z.string().max(40).optional(),
  equipment: z.string().max(40).optional(),
  mediaUrl: z.string().url().max(300).optional(),
});

export async function POST(req: Request) {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await req.json();
  const parsed = CreateCustom.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payload = { ...parsed.data };
  if (!payload.mediaUrl) {
    payload.mediaUrl = placeholderForBodyPart(payload.bodyPart);
  }

  const created = await prisma.customExercise.create({
    data: { userId: user.id, ...payload },
  });

  return NextResponse.json(created, { status: 201 });
}
