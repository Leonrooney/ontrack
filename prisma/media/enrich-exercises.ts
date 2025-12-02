import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map your canonical bodyPart labels to placeholder files
const PLACEHOLDERS: Record<string, string> = {
  arms: '/exercises/placeholders/arms.svg',
  back: '/exercises/placeholders/back.svg',
  chest: '/exercises/placeholders/chest.svg',
  core: '/exercises/placeholders/core.svg',
  legs: '/exercises/placeholders/legs.svg',
  shoulders: '/exercises/placeholders/shoulders.svg',
  other: '/exercises/placeholders/default.svg',
  // anything not matched falls back to default
};

function placeholderFor(bodyPart?: string | null): string {
  const key = (bodyPart || '').toLowerCase().trim();
  return (
    PLACEHOLDERS[key] ??
    // handle odd legacy labels like "waist" etc.
    (key.includes('waist') ? PLACEHOLDERS.core : PLACEHOLDERS.other)
  );
}

async function main() {
  const toFix = await prisma.exercise.findMany({
    where: { isActive: true, mediaUrl: null },
    select: { id: true, name: true, bodyPart: true },
  });

  let updated = 0;
  for (const row of toFix) {
    const mediaUrl = placeholderFor(row.bodyPart);
    await prisma.exercise.update({
      where: { id: row.id },
      data: { mediaUrl },
    });
    updated++;
  }

  console.log(`Enriched placeholders: updated=${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());