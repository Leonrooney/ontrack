import { PrismaClient } from '@prisma/client';

import bcrypt from 'bcrypt';

import { addDays, subDays } from 'date-fns';

import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Demo user

  const email = 'demo@ontrack.app';

  const passwordHash = await bcrypt.hash('Passw0rd!', 10);

  const user = await prisma.users.upsert({
    where: { email },

    update: { passwordHash, updatedAt: new Date() }, // Always update passwordHash to ensure it's set correctly

    create: {
      id: randomUUID(),
      email,
      name: 'Demo User',
      passwordHash,
      updatedAt: new Date(),
    },
  });

  // 30 days of synthetic activity

  const today = new Date();

  const start = subDays(today, 29);

  const entries = [];

  for (let i = 0; i < 30; i++) {
    const d = addDays(start, i);

    const steps = 6000 + Math.floor(Math.random() * 6000);

    const distanceKm = parseFloat((steps * 0.0007).toFixed(2));

    const calories = 1800 + Math.floor(Math.random() * 600);

    const hr = 60 + Math.floor(Math.random() * 40);

    const workouts = Math.random() < 0.35 ? 1 : 0;

    entries.push({
      id: randomUUID(),

      userId: user.id,

      date: d,

      steps,

      distanceKm,

      calories,

      heartRateAvg: hr,

      workouts,

      updatedAt: new Date(),
    });
  }

  await prisma.activity_entries.createMany({ data: entries });

  // Goals

  await prisma.goals.createMany({
    data: [
      {
        id: randomUUID(),
        userId: user.id,
        type: 'STEPS',
        targetInt: 8000,
        period: 'DAILY',
        startDate: new Date(),
        updatedAt: new Date(),
      },

      {
        id: randomUUID(),
        userId: user.id,
        type: 'WORKOUTS',
        targetInt: 3,
        period: 'WEEKLY',
        startDate: new Date(),
        updatedAt: new Date(),
      },

      {
        id: randomUUID(),
        userId: user.id,
        type: 'DISTANCE',
        targetDec: 25.0,
        period: 'WEEKLY',
        startDate: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  // FAQs

  await prisma.faqs.createMany({
    data: [
      {
        id: randomUUID(),
        question: 'How many steps should I aim for daily?',
        answer:
          'A common target is 8–10k, but personalize based on your baseline.',
        tags: JSON.stringify(['steps', 'goals']),
        updatedAt: new Date(),
      },

      {
        id: randomUUID(),
        question: 'What is a healthy calorie deficit?',
        answer:
          'Typically 300–500/day for gradual weight loss, consult a professional.',
        tags: JSON.stringify(['nutrition', 'calories']),
        updatedAt: new Date(),
      },

      {
        id: randomUUID(),
        question: 'How often should I strength train?',
        answer: '2–3 sessions/week for most beginners.',
        tags: JSON.stringify(['workouts', 'strength']),
        updatedAt: new Date(),
      },

      {
        id: randomUUID(),
        question: 'Does walking count as cardio?',
        answer: 'Yes—track pace and duration; consistency matters.',
        tags: JSON.stringify(['cardio', 'habits']),
        updatedAt: new Date(),
      },

      {
        id: randomUUID(),
        question: 'How much water should I drink?',
        answer: 'Rough guide is 2–3L/day; adjust for activity and climate.',
        tags: JSON.stringify(['hydration']),
        updatedAt: new Date(),
      },
    ],
  });

  console.log('Seed complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })

  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
