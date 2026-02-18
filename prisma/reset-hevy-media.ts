/**
 * Clears mediaUrl for all exercises that currently use an image from
 * public/exercises/hevy/. Use before re-copying and re-assigning images.
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/reset-hevy-media.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.exercises.updateMany({
    where: {
      mediaUrl: { startsWith: '/exercises/hevy/' },
    },
    data: { mediaUrl: null },
  });
  console.log(`Cleared mediaUrl for ${result.count} exercises (was /exercises/hevy/...)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
