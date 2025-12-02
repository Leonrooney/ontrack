import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXERCISES = [
  // Chest
  { name: 'Barbell Bench Press', bodyPart: 'Chest', equipment: 'Barbell' },
  { name: 'Incline Dumbbell Press', bodyPart: 'Chest', equipment: 'Dumbbell' },
  { name: 'Chest Fly (Cable)', bodyPart: 'Chest', equipment: 'Cable' },
  // Back
  { name: 'Deadlift', bodyPart: 'Back', equipment: 'Barbell' },
  { name: 'Lat Pulldown', bodyPart: 'Back', equipment: 'Machine' },
  { name: 'Seated Cable Row', bodyPart: 'Back', equipment: 'Cable' },
  // Legs
  { name: 'Back Squat', bodyPart: 'Legs', equipment: 'Barbell' },
  { name: 'Leg Press', bodyPart: 'Legs', equipment: 'Machine' },
  { name: 'Romanian Deadlift', bodyPart: 'Legs', equipment: 'Barbell' },
  // Shoulders
  { name: 'Overhead Press', bodyPart: 'Shoulders', equipment: 'Barbell' },
  { name: 'Lateral Raise', bodyPart: 'Shoulders', equipment: 'Dumbbell' },
  // Arms
  { name: 'Barbell Curl', bodyPart: 'Arms', equipment: 'Barbell' },
  { name: 'Tricep Pushdown', bodyPart: 'Arms', equipment: 'Cable' },
  // Core
  { name: 'Plank', bodyPart: 'Core', equipment: 'Bodyweight' },
  { name: 'Cable Crunch', bodyPart: 'Core', equipment: 'Cable' },
];

async function main() {
  for (const e of EXERCISES) {
    await prisma.exercise.upsert({
      where: { name: e.name },
      update: { isActive: true },
      create: e,
    });
  }
  console.log('Seeded exercises:', EXERCISES.length);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });




