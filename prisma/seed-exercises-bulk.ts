import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const file = path.join(process.cwd(), 'prisma', 'exercises.bulk.json');
  const raw = fs.readFileSync(file, 'utf8');
  const items: Array<{
    name: string;
    bodyPart?: string;
    equipment?: string;
    mediaUrl?: string;
    instructions?: string;
  }> = JSON.parse(raw);

  let upserts = 0;
  for (const e of items) {
    await prisma.exercises.upsert({
      where: { name: e.name },
      update: {
        bodyPart: e.bodyPart ?? null,
        equipment: e.equipment ?? null,
        mediaUrl: e.mediaUrl ?? null,
        instructions: e.instructions ?? null,
        isActive: true,
      },
      create: {
        id: randomUUID(),
        name: e.name,
        bodyPart: e.bodyPart,
        equipment: e.equipment,
        mediaUrl: e.mediaUrl ?? null,
        instructions: e.instructions ?? null,
      },
    });
    upserts++;
  }
  console.log(`Bulk catalog upserted: ${upserts} exercises`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
