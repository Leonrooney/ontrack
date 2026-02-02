import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export interface PersonalBestResult {
  setId: string;
  type: 'weight' | 'reps';
  weightKg?: number;
  reps?: number;
  value: number;
  description: string;
}

/**
 * Detect personal bests for a set
 * Returns array of PB results if any PBs are detected
 */
export async function detectPersonalBests(
  userId: string,
  exerciseId: string | null,
  customId: string | null,
  setId: string,
  weightKg: number | null,
  reps: number
): Promise<PersonalBestResult[]> {
  const results: PersonalBestResult[] = [];

  if (!exerciseId && !customId) {
    return results; // Can't track PB without an exercise
  }

  // Find all previous sets for this exercise
  const previousSets = await prisma.workout_sets.findMany({
    where: {
      workout_items: {
        workout_sessions: {
          userId,
        },
        ...(exerciseId ? { exerciseId } : { customId }),
      },
      id: { not: setId }, // Exclude current set
    },
    select: {
      id: true,
      weightKg: true,
      reps: true,
    },
  });

  // Check for weight PB (heaviest weight ever lifted for this exercise)
  if (weightKg != null && weightKg > 0) {
    const maxWeight = previousSets
      .map((s) => (s.weightKg ? Number(s.weightKg) : 0))
      .reduce((max, w) => Math.max(max, w), 0);

    if (weightKg > maxWeight) {
      results.push({
        setId,
        type: 'weight',
        weightKg,
        reps,
        value: weightKg,
        description: `New personal best – heaviest weight (${weightKg}kg)`,
      });
    }
  }

  // Check for rep PB at this specific weight (with tolerance for floating point)
  if (weightKg != null && weightKg > 0) {
    const weightTolerance = 0.01; // 10g tolerance for weight comparison
    const maxRepsAtWeight = previousSets
      .filter((s) => {
        if (!s.weightKg) return false;
        const setWeight = Number(s.weightKg);
        return Math.abs(setWeight - weightKg) < weightTolerance;
      })
      .map((s) => s.reps)
      .reduce((max, r) => Math.max(max, r), 0);

    if (reps > maxRepsAtWeight) {
      results.push({
        setId,
        type: 'reps',
        weightKg,
        reps,
        value: reps,
        description: `New personal best – rep max at ${weightKg}kg (${reps} reps)`,
      });
    }
  }

  return results;
}

/**
 * Store personal best records in the database
 */
export async function storePersonalBests(
  userId: string,
  exerciseId: string | null,
  customId: string | null,
  pbs: PersonalBestResult[]
): Promise<void> {
  for (const pb of pbs) {
    if (pb.type === 'weight') {
      // For weight PB: find the max weight PB for this exercise
      const existing = await prisma.personal_bests.findFirst({
        where: {
          userId,
          ...(exerciseId ? { exerciseId } : { customId }),
          type: 'weight',
        },
        orderBy: { value: 'desc' },
      });

      if (existing) {
        // Update if this is a better weight PB
        if (pb.value > Number(existing.value)) {
          await prisma.personal_bests.update({
            where: { id: existing.id },
            data: {
              setId: pb.setId,
              weightKg: pb.weightKg ? pb.weightKg : null,
              reps: pb.reps ?? null,
              value: pb.value,
              createdAt: new Date(),
            },
          });
        }
      } else {
        // Create new weight PB record
        await prisma.personal_bests.create({
          data: {
            id: randomUUID(),
            userId,
            exerciseId: exerciseId || null,
            customId: customId || null,
            type: 'weight',
            weightKg: pb.weightKg ? pb.weightKg : null,
            reps: pb.reps ?? null,
            value: pb.value,
            setId: pb.setId,
          },
        });
      }
    } else if (pb.type === 'reps' && pb.weightKg) {
      // For reps PB: find existing PB at this exact weight (with tolerance)
      const weightTolerance = 0.01;
      const existing = await prisma.personal_bests.findFirst({
        where: {
          userId,
          ...(exerciseId ? { exerciseId } : { customId }),
          type: 'reps',
          weightKg: {
            gte: pb.weightKg - weightTolerance,
            lte: pb.weightKg + weightTolerance,
          },
        },
      });

      if (existing) {
        // Update if this is more reps at the same weight
        if (pb.value > Number(existing.value)) {
          await prisma.personal_bests.update({
            where: { id: existing.id },
            data: {
              setId: pb.setId,
              weightKg: pb.weightKg,
              reps: pb.reps ?? null,
              value: pb.value,
              createdAt: new Date(),
            },
          });
        }
      } else {
        // Create new reps PB record at this weight
        await prisma.personal_bests.create({
          data: {
            id: randomUUID(),
            userId,
            exerciseId: exerciseId || null,
            customId: customId || null,
            type: 'reps',
            weightKg: pb.weightKg,
            reps: pb.reps ?? null,
            value: pb.value,
            setId: pb.setId,
          },
        });
      }
    }
  }
}

/**
 * Get all personal best set IDs for a user's workouts
 * Returns a Set of set IDs that are PBs
 */
export async function getPersonalBestSetIds(
  userId: string,
  workoutIds?: string[]
): Promise<Set<string>> {
  const where: any = {
    userId,
  };

  if (workoutIds && workoutIds.length > 0) {
    where.workout_sets = {
      workout_items: {
        workoutId: { in: workoutIds },
      },
    };
  }

  const pbs = await prisma.personal_bests.findMany({
    where,
    select: {
      setId: true,
    },
  });

  return new Set(pbs.map((pb) => pb.setId));
}
