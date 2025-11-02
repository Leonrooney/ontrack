import { NextResponse } from 'next/server';
import { getSessionSafe } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/serialize';
import { forecastSeries, ForecastMethod } from '@/lib/forecast';
import { subDays, startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getSessionSafe();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const metric = (url.searchParams.get('metric') ?? 'steps') as 'steps' | 'calories' | 'distance';
  const method = (url.searchParams.get('method') ?? 'ma') as ForecastMethod;
  const horizon = Number(url.searchParams.get('horizon') ?? 14);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use the last 60 days for baseline
  const end = startOfDay(new Date());
  const start = startOfDay(subDays(end, 59));

  const entries = await prisma.activityEntry.findMany({
    where: { userId: user.id, date: { gte: start, lte: end } },
    orderBy: { date: 'asc' },
  });

  const dates = entries.map((e) => e.date.toISOString().slice(0, 10));
  const series = entries.map((e) => {
    if (metric === 'steps') return e.steps ?? 0;
    if (metric === 'calories') return e.calories ?? 0;
    return toNumber(e.distanceKm) ?? 0;
  });

  const { history, future } = forecastSeries(dates, series, horizon, method);

  return NextResponse.json({ metric, method, horizon, history, future }, { status: 200 });
}

