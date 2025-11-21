import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function host(u?: string | null) {
  if (!u) return 'null';
  try {
    return new URL(u).hostname;
  } catch {
    return 'invalid';
  }
}

async function main() {
  const rows = await prisma.exercise.findMany({ select: { mediaUrl: true } });

  const counts = new Map<string, number>();

  for (const r of rows) {
    const h = host(r.mediaUrl);
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }

  console.table([...counts.entries()].map(([host, count]) => ({ host, count })));
}

main().finally(() => prisma.$disconnect());



