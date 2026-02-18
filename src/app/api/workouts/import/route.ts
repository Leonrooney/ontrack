import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionSafe } from '@/lib/auth';
import { z } from 'zod';
import { toPlain } from '@/lib/serialize';
import { detectPersonalBests, storePersonalBests } from '@/lib/personal-best';
import { parseCSVToWorkouts } from '@/lib/workout-csv';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const SetSchema = z.object({
  setNumber: z.number().int().min(1),
  weightKg: z.number().nonnegative().optional(),
  reps: z.number().int().min(1).max(100),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().max(200).optional(),
});

const ItemSchema = z.object({
  exerciseName: z.string().min(1),
  sets: z.array(SetSchema).min(1),
});

const ImportWorkoutSchema = z.object({
  date: z.string().datetime(),
  title: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(ItemSchema).min(1),
});

const BulkImportSchema = z.object({
  workouts: z.array(ImportWorkoutSchema).min(1),
});

/**
 * POST /api/workouts/import
 * Bulk import workouts from CSV data
 */
export async function POST(req: Request) {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const json = await req.json();
    const { csvText } = json;

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json(
        { error: 'CSV text is required' },
        { status: 400 }
      );
    }

    // Parse CSV to workout format
    const parsedWorkouts = parseCSVToWorkouts(csvText);

    if (parsedWorkouts.length === 0) {
      return NextResponse.json(
        { error: 'No workouts found in CSV' },
        { status: 400 }
      );
    }

    // Validate and create workouts
    const createdWorkouts = [];
    const errors: string[] = [];

    for (const workoutData of parsedWorkouts) {
      try {
        // Find or create exercises
        const items = [];
        for (const itemData of workoutData.items) {
          if (!itemData.exerciseName || itemData.exerciseName.trim() === '') {
            continue; // Skip empty exercise names
          }

          // Try to find exercise by exact name match first
          let exercise = await prisma.exercises.findFirst({
            where: {
              name: {
                equals: itemData.exerciseName.trim(),
                mode: 'insensitive',
              },
              isActive: true,
            },
          });

          // If not found, try partial match (contains)
          if (!exercise) {
            exercise = await prisma.exercises.findFirst({
              where: {
                name: {
                  contains: itemData.exerciseName.trim(),
                  mode: 'insensitive',
                },
                isActive: true,
              },
            });
          }

          if (exercise) {
            items.push({
              exerciseId: exercise.id,
              sets: itemData.sets,
            });
          } else {
            // Check if custom exercise already exists
            let customExercise = await prisma.custom_exercises.findFirst({
              where: {
                userId: user.id,
                name: {
                  equals: itemData.exerciseName.trim(),
                  mode: 'insensitive',
                },
                isActive: true,
              },
            });

            if (!customExercise) {
              // Create custom exercise
              customExercise = await prisma.custom_exercises.create({
                data: {
                  id: randomUUID(),
                  userId: user.id,
                  name: itemData.exerciseName.trim(),
                  isActive: true,
                },
              });
            }

            items.push({
              customId: customExercise.id,
              sets: itemData.sets,
            });
          }
        }

        if (items.length === 0) {
          errors.push(
            `Workout "${workoutData.title || 'Untitled'}" has no valid exercises`
          );
          continue;
        }

        // Validate workout structure
        const validatedItems = items.map((it) => {
          if ('exerciseId' in it) {
            return {
              exerciseId: it.exerciseId,
              sets: it.sets,
            };
          } else {
            return {
              customId: it.customId,
              sets: it.sets,
            };
          }
        });

        const validatedWorkout = {
          date: workoutData.date,
          title: workoutData.title,
          notes: workoutData.notes,
          items: validatedItems,
        };

        // Create workout
        const created = await prisma.workout_sessions.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            date: new Date(validatedWorkout.date),
            title: validatedWorkout.title,
            notes: validatedWorkout.notes,
            workout_items: {
              create: validatedItems.map((it, idx) => ({
                id: randomUUID(),
                orderIndex: idx,
                exerciseId: 'exerciseId' in it ? it.exerciseId : null,
                customId: 'customId' in it ? it.customId : null,
                workout_sets: {
                  create: it.sets.map((s: any) => ({
                    id: randomUUID(),
                    setNumber: s.setNumber,
                    weightKg: s.weightKg != null ? s.weightKg : null,
                    reps: s.reps,
                    rpe: s.rpe != null ? s.rpe : null,
                    notes: s.notes,
                  })),
                },
              })),
            },
          },
          include: {
            workout_items: {
              include: {
                exercises: {
                  select: { id: true, name: true, mediaUrl: true },
                },
                custom_exercises: {
                  select: { id: true, name: true, mediaUrl: true },
                },
                workout_sets: true,
              },
            },
          },
        });

        // Detect and store personal bests
        for (const item of created.workout_items) {
          const exerciseId = item.exerciseId;
          const customId = item.customId;

          for (const set of item.workout_sets) {
            const pbs = await detectPersonalBests(
              user.id,
              exerciseId,
              customId,
              set.id,
              set.weightKg ? Number(set.weightKg) : null,
              set.reps
            );

            if (pbs.length > 0) {
              await storePersonalBests(user.id, exerciseId, customId, pbs);
            }
          }
        }

        // Map workout_items to items for API compatibility
        const response: any = toPlain(created);
        if (response.workout_items) {
          response.items = response.workout_items.map((item: any) => {
            // Map exercises/custom_exercises to exercise/custom for frontend compatibility
            // Map workout_sets to sets for frontend compatibility
            const mappedItem: any = {
              ...item,
              exercise: item.exercises || null,
              custom: item.custom_exercises || null,
              sets: item.workout_sets || [],
            };
            delete mappedItem.exercises;
            delete mappedItem.custom_exercises;
            delete mappedItem.workout_sets;
            return mappedItem;
          });
          delete response.workout_items;
        }
        createdWorkouts.push(response);
      } catch (error: any) {
        errors.push(
          `Failed to import workout "${workoutData.title || 'Untitled'}": ${error.message}`
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        imported: createdWorkouts.length,
        total: parsedWorkouts.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to import workouts' },
      { status: 400 }
    );
  }
}
