import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import {
  loadRegistry,
  normalizeName,
  placeholderForBodyPart,
} from '@/lib/media/enrich';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = (process.env.MEDIA_ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email || (ADMIN_EMAILS.length && !ADMIN_EMAILS.includes(email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reg = loadRegistry();
  let catalogUpdated = 0;
  let customUpdated = 0;

  const catalog = await prisma.exercises.findMany();
  for (const ex of catalog) {
    if (ex.mediaUrl) continue;
    const url =
      reg[normalizeName(ex.name)] ?? placeholderForBodyPart(ex.bodyPart);
    await prisma.exercises.update({
      where: { id: ex.id },
      data: { mediaUrl: url },
    });
    catalogUpdated++;
  }

  const custom = await prisma.custom_exercises.findMany();
  for (const ex of custom) {
    if (ex.mediaUrl) continue;
    const url =
      reg[normalizeName(ex.name)] ?? placeholderForBodyPart(ex.bodyPart);
    await prisma.custom_exercises.update({
      where: { id: ex.id },
      data: { mediaUrl: url },
    });
    customUpdated++;
  }

  return NextResponse.json({ catalogUpdated, customUpdated });
}
