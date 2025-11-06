import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bad = await prisma.exercise.findMany({
    where: { mediaUrl: { contains: 'upload.wikimedia.org' } },
  });
  for (const e of bad) {
    await prisma.exercise.update({ where: { id: e.id }, data: { mediaUrl: null } }).catch(() => {});
  }
  console.log(`✅ Nullified media for ${bad.length} Wikimedia URLs`);
}

main().finally(() => prisma.$disconnect());

