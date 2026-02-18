import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { toPlain } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  weightKg: z.coerce
    .number()
    .positive('Weight must be greater than 0')
    .max(500, 'Weight must be 500 kg or less'),
  note: z
    .string()
    .max(200)
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : undefined)),
});

/**
 * GET /api/profile/weight
 * Returns the current user's weight log entries (newest first), and optionally limit.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(
        Math.max(1, Number(searchParams.get('limit') ?? 100)),
        500
      ),
      order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc';

    const logs = await prisma.weight_logs.findMany({
      where: { userId: auth.userId },
      orderBy: { loggedAt: order },
      take: limit,
    });

    const plain = logs.map((l) => toPlain(l));
    return NextResponse.json({ entries: plain });
  } catch (err) {
    console.error('GET /api/profile/weight error:', err);
    return NextResponse.json(
      { error: 'Failed to load weight log' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/weight
 * Log a weight check-in.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors.weightKg?.[0];
    return NextResponse.json(
      { error: first ?? 'Invalid input. Enter a weight between 0 and 500 kg.' },
      { status: 400 }
    );
  }

  const { weightKg, note } = parsed.data;
  try {
    const entry = await prisma.weight_logs.create({
      data: {
        id: randomUUID(),
        userId: auth.userId,
        weightKg: Number(weightKg),
        note: note ?? null,
      },
    });
    return NextResponse.json(toPlain(entry));
  } catch (err) {
    console.error('Weight log create error:', err);
    return NextResponse.json(
      { error: 'Failed to save weight. Please try again.' },
      { status: 500 }
    );
  }
}
