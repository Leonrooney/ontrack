import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function loadRegistry(): Record<string, string> {
  const file = path.join(process.cwd(), 'prisma', 'exercise-media.registry.json');
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw) as Record<string, string>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) out[normalizeName(k)] = v;
  return out;
}

function placeholderForBodyPart(part?: string | null) {
  const p = (part ?? '').toLowerCase();
  if (p.includes('chest')) return '/exercises/placeholders/chest.svg';
  if (p.includes('back')) return '/exercises/placeholders/back.svg';
  if (p.includes('leg')) return '/exercises/placeholders/legs.svg';
  if (p.includes('shoulder')) return '/exercises/placeholders/shoulders.svg';
  if (p.includes('arm') || p.includes('bicep') || p.includes('tricep')) return '/exercises/placeholders/arms.svg';
  if (p.includes('core') || p.includes('abs') || p.includes('ab')) return '/exercises/placeholders/core.svg';
  return '/exercises/placeholders/default.svg';
}

async function main() {
  const reg = loadRegistry();
  let updated = 0;
  let skipped = 0;

  const items = await prisma.customExercise.findMany();
  for (const ex of items) {
    if (ex.mediaUrl) {
      skipped++;
      continue;
    }
    const key = normalizeName(ex.name);
    const url = reg[key] ?? placeholderForBodyPart(ex.bodyPart);
    await prisma.customExercise.update({ where: { id: ex.id }, data: { mediaUrl: url } });
    updated++;
  }

  console.log(`✅ Enriched custom media: updated=${updated}, skipped=${skipped}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

