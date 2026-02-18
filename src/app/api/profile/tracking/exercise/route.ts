import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';
import { normalizeExerciseNameForMatch } from '@/lib/exercises';

export const dynamic = 'force-dynamic';

function toNum(d: Decimal | null | undefined): number | null {
  if (d == null) return null;
  return Number(d.toString());
}

/**
 * GET /api/profile/tracking/exercise
 * Returns time series of max weight or max reps for a given exercise (per workout session).
 * One point per session, oldest to newest — full timeline from first to latest attempt.
 * Query: exerciseId=... OR customId=..., metric=maxWeight|maxReps, limit=optional
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const exerciseId = searchParams.get('exerciseId') ?? undefined;
    const customId = searchParams.get('customId') ?? undefined;
    const metric = (searchParams.get('metric') ?? 'maxWeight') as
      | 'maxWeight'
      | 'maxReps';
    const limit = Math.min(
      Math.max(1, Number(searchParams.get('limit') ?? 500)),
      500
    );

    if (!exerciseId && !customId) {
      return NextResponse.json(
        { error: 'Provide exerciseId or customId' },
        { status: 400 }
      );
    }
    if (exerciseId && customId) {
      return NextResponse.json(
        { error: 'Provide only one of exerciseId or customId' },
        { status: 400 }
      );
    }

    // Unify catalog + custom: match by normalized name so "Bench Press (Barbell)" (custom)
    // is treated as the same as "Barbell Bench Press" (catalog).
    type ItemWhere =
      | { exerciseId: string }
      | { customId: string }
      | { customId: { in: string[] }; exerciseId?: never }
      | { exerciseId: { in: string[] }; customId?: never }
      | { OR: Array<{ exerciseId: string } | { customId: { in: string[] } } | { customId: string } | { exerciseId: { in: string[] } }> };
    let itemFilter: ItemWhere;
    let includeItemWhere: ItemWhere;

    if (exerciseId) {
      const catalog = await prisma.exercises.findUnique({
        where: { id: exerciseId },
        select: { name: true },
      });
      if (!catalog) {
        return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
      }
      const catalogNormalized = normalizeExerciseNameForMatch(catalog.name);
      const allCustoms = await prisma.custom_exercises.findMany({
        where: { userId: auth.userId },
        select: { id: true, name: true },
      });
      const matchingCustomIds = allCustoms
        .filter((c) => normalizeExerciseNameForMatch(c.name) === catalogNormalized)
        .map((c) => c.id);
      if (matchingCustomIds.length === 0) {
        itemFilter = { exerciseId };
        includeItemWhere = { exerciseId };
      } else {
        itemFilter = {
          OR: [
            { exerciseId },
            { customId: { in: matchingCustomIds } },
          ],
        };
        includeItemWhere = itemFilter;
      }
    } else {
      const customEx = await prisma.custom_exercises.findFirst({
        where: { id: customId!, userId: auth.userId },
        select: { name: true },
      });
      if (!customEx) {
        return NextResponse.json({ error: 'Custom exercise not found' }, { status: 404 });
      }
      const customNormalized = normalizeExerciseNameForMatch(customEx.name);
      const allCatalog = await prisma.exercises.findMany({
        select: { id: true, name: true },
      });
      const matchingCatalogIds = allCatalog
        .filter((c) => normalizeExerciseNameForMatch(c.name) === customNormalized)
        .map((c) => c.id);
      if (matchingCatalogIds.length === 0) {
        itemFilter = { customId: customId! };
        includeItemWhere = { customId: customId! };
      } else {
        itemFilter = {
          OR: [
            { customId: customId! },
            { exerciseId: { in: matchingCatalogIds } },
          ],
        };
        includeItemWhere = itemFilter;
      }
    }

    const sessions = await prisma.workout_sessions.findMany({
      where: {
        userId: auth.userId,
        workout_items: {
          some: itemFilter,
        },
      },
      orderBy: { date: 'asc' },
      take: limit,
      include: {
        workout_items: {
          where: includeItemWhere,
          include: {
            workout_sets: true,
          },
        },
      },
    });

    // Per-session stats (may be multiple sessions per calendar day)
    const bySession: Array<{
      dateStr: string;
      maxWeight: number | null;
      maxReps: number | null;
    }> = [];
    for (const sess of sessions) {
      let maxWeight: number | null = null;
      let maxReps: number | null = null;
      for (const item of sess.workout_items) {
        for (const set of item.workout_sets) {
          const w = toNum(set.weightKg);
          if (w != null && (maxWeight == null || w > maxWeight))
            maxWeight = w;
          const r = set.reps;
          if (maxReps == null || r > maxReps) maxReps = r;
        }
      }
      bySession.push({
        dateStr: format(new Date(sess.date), 'yyyy-MM-dd'),
        maxWeight,
        maxReps,
      });
    }

    // Aggregate to one point per calendar day (take best weight/reps that day)
    const byDate = new Map<
      string,
      { maxWeight: number | null; maxReps: number | null }
    >();
    for (const row of bySession) {
      const existing = byDate.get(row.dateStr);
      const bestWeight =
        row.maxWeight != null &&
        (existing?.maxWeight == null || row.maxWeight > existing.maxWeight)
          ? row.maxWeight
          : existing?.maxWeight ?? row.maxWeight;
      const bestReps =
        row.maxReps != null &&
        (existing?.maxReps == null || row.maxReps > existing.maxReps)
          ? row.maxReps
          : existing?.maxReps ?? row.maxReps;
      byDate.set(row.dateStr, { maxWeight: bestWeight, maxReps: bestReps });
    }

    const data = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, { maxWeight, maxReps }]) => ({
        date: dateStr,
        label: format(new Date(dateStr + 'T12:00:00'), 'MMM d'),
        maxWeight,
        maxReps,
      }));

    return NextResponse.json({
      data,
      metric,
      exerciseId: exerciseId ?? null,
      customId: customId ?? null,
    });
  } catch (err) {
    console.error('GET /api/profile/tracking/exercise error:', err);
    return NextResponse.json(
      { error: 'Failed to load exercise tracking data' },
      { status: 500 }
    );
  }
}
