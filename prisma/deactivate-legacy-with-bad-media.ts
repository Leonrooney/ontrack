import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bad1 = await prisma.exercise.updateMany({
    where: { mediaUrl: { contains: 'upload.wikimedia.org' } },
    data: { isActive: false },
  });
  const bad2 = await prisma.exercise.updateMany({
    where: { mediaUrl: null },
    data: { isActive: false },
  });
  console.log(`Deactivated with wikimedia: ${bad1.count}, with null media: ${bad2.count}`);
}

main().finally(() => prisma.$disconnect());




