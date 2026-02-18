import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const DEMO_EMAIL = 'demo@ontrack.app';
const DEMO_PASSWORD = 'Passw0rd!';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();

  const user = await prisma.users.findUnique({ where: { email: DEMO_EMAIL } });

  if (!user) {
    console.log('Demo user not found. Creating...');
    await prisma.users.create({
      data: {
        id: randomUUID(),
        email: DEMO_EMAIL,
        name: 'Demo User',
        passwordHash,
        updatedAt: now,
      },
    });
    console.log('Demo user created successfully');
  } else {
    console.log('Demo user found. Updating password to Passw0rd!...');
    await prisma.users.update({
      where: { email: DEMO_EMAIL },
      data: { passwordHash, updatedAt: now },
    });
    console.log('Demo user password updated successfully');
  }

  console.log(`\nDemo credentials:\n  Email: ${DEMO_EMAIL}\n  Password: ${DEMO_PASSWORD}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
