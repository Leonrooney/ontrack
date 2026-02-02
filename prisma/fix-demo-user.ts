import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@ontrack.app';
  const password = 'Passw0rd!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('Demo user not found. Creating...');
    await prisma.user.create({
      data: {
        email,
        name: 'Demo User',
        passwordHash,
      },
    });
    console.log('✅ Demo user created successfully');
  } else {
    console.log('Demo user found. Updating password...');
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });
    console.log('✅ Demo user password updated successfully');
  }

  console.log(`\nDemo credentials:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
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
