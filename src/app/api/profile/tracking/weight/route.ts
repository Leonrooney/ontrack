import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toPlain } from '@/lib/serialize';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/tracking/weight
 * Returns time series of weight check-ins for the current user (oldest first for chart).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(
      Math.max(1, Number(searchParams.get('limit') ?? 365)),
      1000
    );

    const logs = await prisma.weight_logs.findMany({
      where: { userId: auth.userId },
      orderBy: { loggedAt: 'asc' },
      take: limit,
    });

    const data = logs.map((l) => {
      const plain = toPlain(l);
      return {
        date: format(new Date(l.loggedAt), 'yyyy-MM-dd'),
        loggedAt: (plain as any).loggedAt,
        weightKg: (plain as any).weightKg,
      };
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/profile/tracking/weight error:', err);
    return NextResponse.json(
      { error: 'Failed to load weight tracking data' },
      { status: 500 }
    );
  }
}
