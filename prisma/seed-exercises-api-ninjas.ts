import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE =
  process.env.NINJAS_BASE_URL ||
  'https://exercises-by-api-ninjas.p.rapidapi.com/v1';
const HOST =
  process.env.NINJAS_RAPID_HOST || 'exercises-by-api-ninjas.p.rapidapi.com';
const KEY = process.env.NINJAS_RAPID_KEY;

if (!KEY) {
  console.error('NINJAS_RAPID_KEY is required');
  process.exit(1);
}

type NinjasExercise = {
  name: string;
  type?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  instructions?: string;
};

function mapMuscleToBodyPart(muscle?: string): string {
  if (!muscle) return 'Other';
  const m = muscle.toLowerCase();
  if (/^(ab|abs|abdom)/.test(m)) return 'Core';
  if (/oblique/.test(m)) return 'Core';
  if (
    /lower_back|lats|traps?|levator|spine|middle_back|upper_back|back/.test(m)
  )
    return 'Back';
  if (/quad|hamstring|glute|calf|adductor|abductor|leg/.test(m)) return 'Legs';
  if (/pec|chest/.test(m)) return 'Chest';
  if (/deltoid|shoulder/.test(m)) return 'Shoulders';
  if (/bicep|tricep|forearm|arm/.test(m)) return 'Arms';
  return 'Other';
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

async function findCaseInsensitive(name: string) {
  return prisma.exercise.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
}

async function fetchAllFromNinjas(): Promise<NinjasExercise[]> {
  // API Ninjas supports query params (name, muscle, type, difficulty, offset). We'll pull common muscles in batches.
  const muscles = [
    'abdominals',
    'obliques',
    'lower_back',
    'lats',
    'middle_back',
    'upper_back',
    'quadriceps',
    'hamstrings',
    'glutes',
    'calves',
    'chest',
    'shoulders',
    'biceps',
    'triceps',
    'forearms',
  ];

  const headers: Record<string, string> = {
    'X-RapidAPI-Key': KEY!,
    'X-RapidAPI-Host': HOST,
  };

  const collected: NinjasExercise[] = [];
  for (const musc of muscles) {
    const url = `${BASE.replace(/\/$/, '')}/exercises?muscle=${encodeURIComponent(musc)}&offset=0`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(
        `Failed fetch for muscle=${musc}: ${res.status} ${res.statusText}`
      );
      continue;
    }
    const arr = (await res.json()) as NinjasExercise[];
    collected.push(...arr);
  }
  // Also pull a general list without muscle to catch extras
  {
    const url = `${BASE.replace(/\/$/, '')}/exercises?offset=0`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const arr = (await res.json()) as NinjasExercise[];
      collected.push(...arr);
    }
  }
  // Dedupe by lowercase name
  const map = new Map<string, NinjasExercise>();
  for (const ex of collected) {
    const key = ex.name?.toLowerCase();
    if (!key) continue;
    if (!map.has(key)) map.set(key, ex);
  }
  return [...map.values()];
}

async function main() {
  console.log('Fetching from API Ninjas ...');
  const ninjas = await fetchAllFromNinjas();
  console.log(`Received ${ninjas.length} unique exercises from API Ninjas`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const api of ninjas) {
    const name = normalizeName(api.name || '');
    if (!name) {
      skipped++;
      continue;
    }

    const bodyPart = mapMuscleToBodyPart(api.muscle);
    const equipment = api.equipment?.trim() || null;
    const instructions = api.instructions?.trim() || null;

    // We don't have media from API Ninjas; leave null so placeholders or user media can be used.
    const existing = await findCaseInsensitive(name);
    if (existing) {
      await prisma.exercise
        .update({
          where: { id: existing.id },
          data: {
            bodyPart,
            equipment,
            instructions,
            isActive: true,
            // DO NOT touch mediaUrl here (let placeholders or previously set media stand).
          },
        })
        .then(() => updated++)
        .catch((err) => {
          console.error(`Update failed for "${name}":`, err.message);
          skipped++;
        });
    } else {
      await prisma.exercise
        .create({
          data: {
            name,
            bodyPart,
            equipment,
            instructions,
            mediaUrl: null,
            isActive: true,
          },
        })
        .then(() => created++)
        .catch((err) => {
          console.error(`Create failed for "${name}":`, err.message);
          skipped++;
        });
    }
  }

  console.log(
    `Done. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
