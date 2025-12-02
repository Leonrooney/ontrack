import { PrismaClient } from "@prisma/client";

import bcrypt from "bcrypt";

import { addDays, subDays } from "date-fns";



const prisma = new PrismaClient();



async function main() {

  // Demo user

  const email = "demo@ontrack.app";

  const passwordHash = await bcrypt.hash("Passw0rd!", 10);



  const user = await prisma.user.upsert({

    where: { email },

    update: { passwordHash }, // Always update passwordHash to ensure it's set correctly

    create: { email, name: "Demo User", passwordHash },

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

      userId: user.id,

      date: d,

      steps,

      distanceKm,

      calories,

      heartRateAvg: hr,

      workouts,

    });

  }

  await prisma.activityEntry.createMany({ data: entries });



  // Goals

  await prisma.goal.createMany({

    data: [

      { userId: user.id, type: "STEPS", targetInt: 8000, period: "DAILY", startDate: new Date() },

      { userId: user.id, type: "WORKOUTS", targetInt: 3, period: "WEEKLY", startDate: new Date() },

      { userId: user.id, type: "DISTANCE", targetDec: 25.0, period: "WEEKLY", startDate: new Date() },

    ],

  });



  // FAQs

  await prisma.faq.createMany({

    data: [

      { question: "How many steps should I aim for daily?", answer: "A common target is 8–10k, but personalize based on your baseline.", tags: JSON.stringify(["steps","goals"]) },

      { question: "What is a healthy calorie deficit?", answer: "Typically 300–500/day for gradual weight loss, consult a professional.", tags: JSON.stringify(["nutrition","calories"]) },

      { question: "How often should I strength train?", answer: "2–3 sessions/week for most beginners.", tags: JSON.stringify(["workouts","strength"]) },

      { question: "Does walking count as cardio?", answer: "Yes—track pace and duration; consistency matters.", tags: JSON.stringify(["cardio","habits"]) },

      { question: "How much water should I drink?", answer: "Rough guide is 2–3L/day; adjust for activity and climate.", tags: JSON.stringify(["hydration"]) },

    ],

  });



  console.log("Seed complete.");

}



main()

  .then(async () => { await prisma.$disconnect(); })

  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

