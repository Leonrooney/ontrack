/**
 * Adds catalog exercises for every unique exercise name found in
 * public/exercises/hevy/ image filenames that don't already exist.
 * Then you can run assign-hevy-media-from-public to set mediaUrl.
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/add-exercises-from-hevy-images.ts
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function hevyBodyToOurs(token: string): string {
  const lower = token.toLowerCase();
  if (lower.includes('chest')) return 'Chest';
  if (lower.includes('back') || lower.includes('lat')) return 'Back';
  if (
    lower.includes('leg') ||
    lower.includes('thigh') ||
    lower.includes('hip') ||
    lower.includes('calf') ||
    lower.includes('quad') ||
    lower.includes('hamstring')
  )
    return 'Legs';
  if (lower.includes('shoulder') || lower.includes('deltoid')) return 'Shoulders';
  if (
    lower.includes('arm') ||
    lower.includes('bicep') ||
    lower.includes('tricep') ||
    lower.includes('forearm')
  )
    return 'Arms';
  if (
    lower.includes('core') ||
    lower.includes('ab') ||
    lower.includes('waist') ||
    lower.includes('oblique')
  )
    return 'Core';
  if (lower.includes('neck')) return 'Full Body';
  return 'Full Body';
}

const UUID_SUFFIX = /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png)$/i;
function normalizeFilenameForParsing(filename: string): string {
  return filename
    .replace(UUID_SUFFIX, (_, ext: string) => '.' + ext)
    .replace(/thumbnail_+3x/gi, 'thumbnail@3x');
}

function parseExerciseName(filename: string): string {
  const logical = normalizeFilenameForParsing(filename);
  let name = logical.replace(/\.(jpg|jpeg|png)$/i, '');
  name = name.replace(/_(small_)?thumbnail_?@3x$/i, '');
  name = name.replace(/^\d+-/, '');
  const parts = name.split('_');
  let exerciseName = parts[0] ?? '';
  exerciseName = exerciseName
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return exerciseName;
}

function extractBodyPartFromFilename(filename: string): string {
  const logical = normalizeFilenameForParsing(filename);
  const match = logical.match(/_([A-Za-z0-9-]+)_?(?:small_)?thumbnail/i);
  if (match) return hevyBodyToOurs(match[1]);
  return 'Full Body';
}

/** Clean for display and unique catalog name: trim, collapse space, remove trailing (male)/(female)/m/f */
function canonicalizeName(parsed: string): string {
  let s = parsed
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*[_(]?(?:male|female|m|f)[)_]?\s*$/gi, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .trim();
  return s.replace(/\s+/g, ' ').trim() || parsed.trim();
}

function inferEquipment(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('dumbbell')) return 'Dumbbell';
  if (n.includes('barbell')) return 'Barbell';
  if (n.includes('kettlebell')) return 'Kettlebell';
  if (n.includes('cable')) return 'Cable';
  if (n.includes('lever') || n.includes('machine')) return 'Machine';
  if (n.includes('smith')) return 'Smith Machine';
  if (n.includes('band') || n.includes('resistance')) return 'Resistance Band';
  if (n.includes('suspension') || n.includes('suspender') || n.includes('trx')) return 'Suspension';
  if (
    n.includes('push-up') ||
    n.includes('pushup') ||
    n.includes('pull-up') ||
    n.includes('pullup') ||
    n.includes('plank') ||
    n.includes('sit-up') ||
    n.includes('crunch') ||
    n.includes('bodyweight') ||
    ((n.includes('squat') || n.includes('lunge')) &&
      !n.includes('barbell') &&
      !n.includes('dumbbell') &&
      !n.includes('kettlebell'))
  )
    return 'Bodyweight';
  return null;
}

async function main() {
  const hevyDir = path.join(process.cwd(), 'public', 'exercises', 'hevy');
  if (!fs.existsSync(hevyDir)) {
    console.error('Folder not found: public/exercises/hevy');
    process.exit(1);
  }

  const files = fs.readdirSync(hevyDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
  const existing = await prisma.exercises.findMany({
    where: { isActive: true },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase().trim()));

  // unique by canonical name; keep first filename for mediaUrl
  const toAdd = new Map<
    string,
    { bodyPart: string; filename: string; equipment: string | null }
  >();

  for (const file of files) {
    const parsed = parseExerciseName(file);
    const canonical = canonicalizeName(parsed);
    if (!canonical || canonical.length < 2) continue;
    const bodyPart = extractBodyPartFromFilename(file);
    if (existingNames.has(canonical.toLowerCase())) continue;
    if (!toAdd.has(canonical)) {
      toAdd.set(canonical, {
        bodyPart,
        filename: file,
        equipment: inferEquipment(canonical),
      });
    }
  }

  const list = Array.from(toAdd.entries());
  console.log(`${files.length} image files, ${existing.length} existing exercises`);
  console.log(`${list.length} new exercises to add from image filenames`);

  let created = 0;
  for (const [name, { bodyPart, filename, equipment }] of list) {
    try {
      await prisma.exercises.create({
        data: {
          id: crypto.randomUUID(),
          name,
          bodyPart,
          equipment: equipment ?? undefined,
          mediaUrl: `/exercises/hevy/${filename}`,
          isActive: true,
        },
      });
      created++;
      if (created <= 20) {
        console.log(`  + ${name} [${bodyPart}]`);
      }
    } catch (e: any) {
      if (e?.code === 'P2002') {
        existingNames.add(name.toLowerCase());
        continue;
      }
      console.error(`  Failed ${name}:`, e?.message ?? e);
    }
  }

  console.log(`\nCreated ${created} new catalog exercises.`);
  console.log('Run: npm run assign:hevy:media — to link any remaining images to these exercises.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
