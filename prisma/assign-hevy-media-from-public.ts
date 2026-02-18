/**
 * Assigns mediaUrl to exercises in the DB by matching image filenames
 * in public/exercises/hevy/ to exercise names. Uses body part from filename
 * to avoid wrong matches. Run after copying hevy images into that folder.
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/assign-hevy-media-from-public.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map Hevy filename body-part token to our DB bodyPart (Chest, Back, Legs, Shoulders, Arms, Core, Full Body)
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
  return 'Full Body';
}

// Normalize filename for parsing (strip UUID suffix, thumbnail_3x -> thumbnail@3x)
const UUID_SUFFIX = /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png)$/i;
function normalizeFilenameForParsing(filename: string): string {
  return filename
    .replace(UUID_SUFFIX, (_, ext) => '.' + ext)
    .replace(/thumbnail_+3x/gi, 'thumbnail@3x');
}

// Parse exercise name from Hevy filename
// Format: [ID]-[Name]_[Body]_thumbnail@3x.jpg or thumbnail_3x-UUID.png (assets)
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

// Extract body part from filename (second segment before thumbnail)
function extractBodyPartFromFilename(filename: string): string {
  const logical = normalizeFilenameForParsing(filename);
  const match = logical.match(/_([A-Za-z0-9-]+)_?(?:small_)?thumbnail/i);
  if (match) {
    return hevyBodyToOurs(match[1]);
  }
  return 'Full Body';
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMatchingExercise(
  hevyName: string,
  candidates: Array<{ name: string }>
): string | null {
  if (candidates.length === 0) return null;
  const normalizedHevy = normalizeName(hevyName);

  // Exact match
  for (const ex of candidates) {
    if (normalizeName(ex.name) === normalizedHevy) return ex.name;
  }

  // Without parenthetical (e.g. "Dumbbell Bench Press (female)" -> "Dumbbell Bench Press")
  const hevyNoParens = normalizedHevy.replace(/\s*\([^)]+\)\s*/g, '').trim();
  for (const ex of candidates) {
    const ourNoParens = normalizeName(ex.name).replace(/\s*\([^)]+\)\s*/g, '').trim();
    if (ourNoParens === hevyNoParens && ourNoParens.length > 0) return ex.name;
  }

  // Strip trailing " (female)" / " (male)" from hevy name (normalized has no parens, so "female"/"male" at end)
  const hevyStripGender = normalizedHevy.replace(/\s*(?:female|male)\s*$/gi, '').trim();
  for (const ex of candidates) {
    const ourNorm = normalizeName(ex.name).replace(/\s*\([^)]+\)\s*/g, '').trim();
    if (ourNorm === hevyStripGender && ourNorm.length > 0) return ex.name;
  }

  // Core name (strip version, male, female, etc.)
  const hevyCore = normalizedHevy
    .replace(/\s*(version\s*\d+|v\d+|male|female|on\s+bench|standing|seated|lying|kneeling|plate-loaded|with rope|rope attachment|sz-bar)\s*/gi, '')
    .replace(/\s*\([^)]+\)\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  for (const ex of candidates) {
    const ourCore = normalizeName(ex.name)
      .replace(/\s*\([^)]+\)\s*/g, '')
      .replace(/\s*(version\s*\d+|v\d+|male|female|on\s+bench|standing|seated|lying|kneeling|plate-loaded|with rope|rope attachment|sz-bar)\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (ourCore.length >= 4 && hevyCore.length >= 4 && (ourCore === hevyCore || ourCore.includes(hevyCore) || hevyCore.includes(ourCore))) {
      return ex.name;
    }
  }

  // Partial: one contains the other (min length to avoid false matches)
  for (const ex of candidates) {
    const normalizedOur = normalizeName(ex.name);
    if (normalizedHevy.length >= 6 && normalizedOur.length >= 6) {
      if (normalizedOur.includes(normalizedHevy) || normalizedHevy.includes(normalizedOur)) {
        const lengthDiff = Math.abs(normalizedHevy.length - normalizedOur.length);
        if (lengthDiff <= Math.max(normalizedHevy.length, normalizedOur.length) * 0.4) {
          return ex.name;
        }
      }
    }
  }
  return null;
}

async function main() {
  const hevyDir = path.join(process.cwd(), 'public', 'exercises', 'hevy');
  if (!fs.existsSync(hevyDir)) {
    console.error('Folder not found: public/exercises/hevy');
    process.exit(1);
  }

  const files = fs.readdirSync(hevyDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
  const allExercises = await prisma.exercises.findMany({
    where: { isActive: true },
    select: { id: true, name: true, mediaUrl: true, bodyPart: true },
  });

  console.log(`${files.length} image files, ${allExercises.length} exercises`);

  let updated = 0;
  const unmatched: string[] = [];
  const matched: Array<{ file: string; name: string; bodyPart: string }> = [];

  for (const file of files) {
    const parsedName = parseExerciseName(file);
    const fileBodyPart = extractBodyPartFromFilename(file);
    // Only consider exercises that match this body part (or Full Body)
    const candidates = allExercises.filter(
      (e) => e.bodyPart === fileBodyPart || e.bodyPart === 'Full Body'
    );
    const match = findMatchingExercise(parsedName, candidates);
    if (!match) {
      unmatched.push(`${file} -> "${parsedName}" [${fileBodyPart}]`);
      continue;
    }
    const mediaUrl = `/exercises/hevy/${file}`;
    const ex = allExercises.find((e) => e.name === match)!;
    await prisma.exercises.update({
      where: { id: ex.id },
      data: { mediaUrl },
    });
    updated++;
    matched.push({ file, name: match, bodyPart: fileBodyPart });
  }

  console.log(`\nMatched & updated: ${updated}`);
  console.log(`Unmatched files: ${unmatched.length}`);
  if (matched.length > 0 && matched.length <= 25) {
    console.log('\nMatched:');
    matched.forEach((m) => console.log(`  ${m.name} [${m.bodyPart}] <- ${m.file}`));
  } else if (matched.length > 25) {
    console.log('\nFirst 15 matched:');
    matched.slice(0, 15).forEach((m) => console.log(`  ${m.name} [${m.bodyPart}] <- ${m.file}`));
    console.log(`  ... and ${matched.length - 15} more`);
  }
  if (unmatched.length > 0 && unmatched.length <= 40) {
    console.log('\nUnmatched:');
    unmatched.forEach((u) => console.log(`  ${u}`));
  } else if (unmatched.length > 40) {
    unmatched.slice(0, 25).forEach((u) => console.log(`  ${u}`));
    console.log(`  ... and ${unmatched.length - 25} more`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
