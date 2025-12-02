import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODE = process.env.EXDB_MODE ?? 'rapidapi';
const BASE = process.env.EXDB_BASE_URL!;
const RAPID_KEY = process.env.EXDB_RAPID_KEY ?? '';
const FORCE_MEDIA_OVERWRITE = process.env.EXDB_FORCE_MEDIA_OVERWRITE === 'true';

async function findExerciseCaseInsensitive(name: string) {
  return prisma.exercise.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
}

/**
 * RapidAPI v1 returns an array with fields similar to:
 * {
 *   id, name, bodyPart, equipment, gifUrl, target, secondaryMuscles: string[], instructions: string[]
 * }
 * We will upsert by name (your schema uses @@unique([name])).
 * We'll join the instructions array into a single string, and prefer gifUrl for mediaUrl.
 */
async function fetchAllRapid() {
  const url = `${BASE}/exercises`;
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': RAPID_KEY,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
    },
  });
  if (!res.ok) throw new Error(`ExerciseDB RapidAPI error: ${res.status}`);
  return await res.json();
}

async function fetchAllSelfHost() {
  // For self-host V1 (from the official repo), mirror the same schema as v1.
  const url = `${BASE}/exercises`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ExerciseDB selfhost error: ${res.status}`);
  return await res.json();
}

function normalizeBodyPart(bp?: string) {
  if (!bp) return null;
  const s = bp.toLowerCase();
  if (s.includes('chest')) return 'Chest';
  if (s.includes('back') || s.includes('lats')) return 'Back';
  if (s.includes('leg') || s.includes('quad') || s.includes('hamstring') || s.includes('calf') || s.includes('glute'))
    return 'Legs';
  if (s.includes('shoulder') || s.includes('deltoid')) return 'Shoulders';
  if (s.includes('arm') || s.includes('bicep') || s.includes('tricep') || s.includes('forearm')) return 'Arms';
  if (s.includes('core') || s.includes('ab') || s.includes('oblique')) return 'Core';
  return bp;
}

async function main() {
  if (!BASE) {
    console.error('EXDB_BASE_URL environment variable is required');
    process.exit(1);
  }

  if (MODE === 'rapidapi' && !RAPID_KEY) {
    console.error('EXDB_RAPID_KEY environment variable is required for RapidAPI mode');
    process.exit(1);
  }

  console.log(`Fetching exercises from ExerciseDB (mode: ${MODE})...`);
  const items = MODE === 'selfhost' ? await fetchAllSelfHost() : await fetchAllRapid();

  console.log(`Received ${items.length} exercises from ExerciseDB`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const e of items) {
    const name = (e.name ?? '').trim();
    if (!name) {
      skipped++;
      continue;
    }

    const bodyPart = normalizeBodyPart(e.bodyPart ?? e.bodyParts?.[0]);
    const equipment = e.equipment ?? (Array.isArray(e.equipments) ? e.equipments[0] : null);
    const mediaUrl = e.gifUrl ?? e.imageUrl ?? null;
    const instructions = Array.isArray(e.instructions) ? e.instructions.join('\n') : e.instructions ?? null;

    try {
      const existing = await findExerciseCaseInsensitive(name);
      if (existing) {
        await prisma.exercise.update({
          where: { id: existing.id },
          data: {
            bodyPart,
            equipment,
            instructions,
            isActive: true,
            ...(mediaUrl && (FORCE_MEDIA_OVERWRITE || !existing.mediaUrl) ? { mediaUrl } : {}),
          },
        }).catch((err) => {
          console.error(`Failed update for "${name}":`, err.message);
        });
        updated++;
      } else {
        await prisma.exercise.create({
          data: { name, bodyPart, equipment, instructions, mediaUrl, isActive: true },
        }).catch((err) => {
          console.error(`Failed create for "${name}":`, err.message);
        });
        created++;
      }
    } catch (err: any) {
      // Some names may collide or be too long; just skip on error to keep import running
      console.error(`Failed upsert for "${name}":`, err.message);
      skipped++;
    }
  }

  console.log(`ExerciseDB import complete: created=${created}, updated=${updated}, skipped=${skipped}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

