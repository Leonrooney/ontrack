/**
 * Resets catalog to Hevy-only and removes duplicate custom exercises.
 *
 * 1. Catalog (exercises): Keep only exercises that have a Hevy image (mediaUrl
 *    starts with /exercises/hevy/). For any other catalog exercise:
 *    - If it is used in workout_items or personal_bests, try to migrate those
 *      to a Hevy exercise with the same normalized name; then delete it.
 *    - If it is unused, delete it.
 * 2. Custom (custom_exercises): For each custom exercise whose name matches
 *    a catalog exercise (after step 1), migrate workout_items and personal_bests
 *    to use the catalog exercise, then delete the custom. Keeps only custom
 *    exercises that do not duplicate the catalog.
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/cleanup-exercises-keep-hevy-only.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HEVY_PREFIX = '/exercises/hevy/';

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const allCatalog = await prisma.exercises.findMany({
    where: { isActive: true },
    select: { id: true, name: true, mediaUrl: true },
  });

  const hevyCatalog = allCatalog.filter(
    (e) => e.mediaUrl != null && e.mediaUrl.startsWith(HEVY_PREFIX)
  );
  const nonHevyCatalog = allCatalog.filter(
    (e) => e.mediaUrl == null || !e.mediaUrl.startsWith(HEVY_PREFIX)
  );

  const hevyByName = new Map<string, { id: string; name: string }>();
  for (const e of hevyCatalog) {
    const key = normalizeName(e.name);
    if (!hevyByName.has(key)) hevyByName.set(key, { id: e.id, name: e.name });
  }

  console.log(`Catalog: ${allCatalog.length} total, ${hevyCatalog.length} Hevy, ${nonHevyCatalog.length} non-Hevy`);

  // ---- Step 1: Remove non-Hevy catalog; migrate references to Hevy when same name ----
  let catalogDeleted = 0;
  let catalogMigrated = 0;

  for (const ex of nonHevyCatalog) {
    const key = normalizeName(ex.name);
    const hevyMatch = hevyByName.get(key);

    const [itemCount, pbCount] = await Promise.all([
      prisma.workout_items.count({ where: { exerciseId: ex.id } }),
      prisma.personal_bests.count({ where: { exerciseId: ex.id } }),
    ]);
    const used = itemCount > 0 || pbCount > 0;

    if (used && hevyMatch) {
      await prisma.workout_items.updateMany({
        where: { exerciseId: ex.id },
        data: { exerciseId: hevyMatch.id },
      });
      await prisma.personal_bests.updateMany({
        where: { exerciseId: ex.id },
        data: { exerciseId: hevyMatch.id },
      });
      catalogMigrated++;
    } else if (used && !hevyMatch) {
      console.log(`  Keep (used, no Hevy match): ${ex.name}`);
      continue;
    }

    await prisma.exercises.delete({ where: { id: ex.id } });
    catalogDeleted++;
  }

  console.log(`Catalog: migrated ${catalogMigrated} to Hevy, deleted ${catalogDeleted} non-Hevy`);

  // ---- Step 2: Remove custom exercises that duplicate catalog ----
  const catalogAfter = await prisma.exercises.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });
  const catalogNames = new Map<string, { id: string }>();
  for (const e of catalogAfter) {
    const key = normalizeName(e.name);
    if (!catalogNames.has(key)) catalogNames.set(key, { id: e.id });
  }

  const customList = await prisma.custom_exercises.findMany({
    where: { isActive: true },
    select: { id: true, name: true, userId: true },
  });

  let customDeleted = 0;
  let customMigrated = 0;

  for (const c of customList) {
    const key = normalizeName(c.name);
    const catalogMatch = catalogNames.get(key);
    if (!catalogMatch) continue;

    const [itemCount, pbCount] = await Promise.all([
      prisma.workout_items.count({ where: { customId: c.id } }),
      prisma.personal_bests.count({ where: { customId: c.id } }),
    ]);

    if (itemCount > 0 || pbCount > 0) {
      await prisma.workout_items.updateMany({
        where: { customId: c.id },
        data: { exerciseId: catalogMatch.id, customId: null },
      });
      await prisma.personal_bests.updateMany({
        where: { customId: c.id },
        data: { exerciseId: catalogMatch.id, customId: null },
      });
      customMigrated++;
    }

    await prisma.custom_exercises.delete({ where: { id: c.id } });
    customDeleted++;
  }

  console.log(`Custom: migrated ${customMigrated} to catalog, deleted ${customDeleted} duplicates`);
  console.log(`Done. Catalog size: ${catalogAfter.length}, custom kept: ${customList.length - customDeleted}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
