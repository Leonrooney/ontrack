import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { placeholderForBodyPart } from '@/lib/media/enrich';
import { randomUUID } from 'crypto';
import { getBodyPartFilterValues } from '@/lib/exercises';

export const dynamic = 'force-dynamic';

/**
 * GET /api/exercises
 *
 * Query parameters:
 * - q: Search query (case-insensitive name search)
 * - bodyPart: Filter by body part ('all' to show all)
 * - includeCustom: Include user's custom exercises (default: true)
 * - includeInactive: Include inactive exercises (default: false)
 *
 * Returns: { catalog: Exercise[], custom: CustomExercise[] }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
  const bodyPart = (url.searchParams.get('bodyPart') ?? '').trim();
  const includeCustom =
    (url.searchParams.get('includeCustom') ?? 'true') === 'true';
  const includeInactive = url.searchParams.get('includeInactive') === 'true';

  // Build where clause for catalog exercises
  const where: any = includeInactive ? {} : { isActive: true };
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (bodyPart && bodyPart !== 'all') {
    const possibleValues = getBodyPartFilterValues(bodyPart);
    where.bodyPart = { in: possibleValues };
  }

  const catalog = await prisma.exercises.findMany({
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
    const auth = await requireAuth();
    if (auth) {
      const customWhere: any = { userId: auth.userId, isActive: true };
        if (q) customWhere.name = { contains: q, mode: 'insensitive' };
        if (bodyPart && bodyPart !== 'all') {
          const possibleValues = getBodyPartFilterValues(bodyPart);
          customWhere.bodyPart = { in: possibleValues };
        }
      custom = await prisma.custom_exercises.findMany({
        where: customWhere,
        orderBy: [{ bodyPart: 'asc' }, { name: 'asc' }],
      });
    }
  }

  return NextResponse.json({ catalog, custom });
}

/**
 * POST /api/exercises
 *
 * Creates a custom exercise for the authenticated user
 *
 * Request body:
 * - name: Exercise name (2-80 characters)
 * - bodyPart: Optional body part category (max 40 characters)
 * - equipment: Optional equipment type (max 40 characters)
 * - mediaUrl: Optional media URL (max 300 characters, must be valid URL)
 *
 * Returns: Created custom exercise
 */
const CreateCustom = z.object({
  name: z.string().min(2).max(80),
  bodyPart: z.string().max(40).optional(),
  equipment: z.string().max(40).optional(),
  mediaUrl: z.string().url().max(300).optional(),
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await req.json();
  const parsed = CreateCustom.safeParse(json);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );

  const payload = { ...parsed.data };
  if (!payload.mediaUrl) {
    payload.mediaUrl = placeholderForBodyPart(payload.bodyPart);
  }

  const created = await prisma.custom_exercises.create({
    data: { id: randomUUID(), userId: auth.userId, ...payload },
  });

  return NextResponse.json(created, { status: 201 });
}
