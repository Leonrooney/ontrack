import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionSafe } from '@/lib/auth';
import { subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Muscle group data structure for radar chart
 * Each key represents a major muscle group with its volume count
 */
interface MuscleGroupData {
  Back: number;
  Chest: number;
  Core: number;
  Shoulders: number;
  Arms: number;
  Legs: number;
}

/**
 * GET /api/workouts/stats/muscle-groups
 *
 * Returns muscle group distribution statistics for radar chart visualization
 *
 * Query parameters:
 * - range: Number of days to analyze (default: 30)
 *
 * Returns:
 * - current: Normalized current period data (0-100 scale)
 * - previous: Normalized previous period data (0-100 scale)
 * - currentRaw: Raw set counts for current period
 * - previousRaw: Raw set counts for previous period
 * - maxValue: Maximum value used for normalization
 */
export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const rangeDays = Number(url.searchParams.get('range') ?? 30);

  // Calculate date ranges for current and previous periods
  const endDate = new Date();
  const currentStartDate = subDays(endDate, rangeDays);
  const previousStartDate = subDays(currentStartDate, rangeDays);
  const previousEndDate = currentStartDate;

  // Helper function to infer body part from exercise name
  const inferBodyPartFromName = (
    name: string
  ): keyof MuscleGroupData | null => {
    if (!name) return null;
    const lower = name.toLowerCase();

    // Arms exercises
    if (
      lower.includes('curl') ||
      lower.includes('bicep') ||
      lower.includes('tricep') ||
      lower.includes('biceps') ||
      lower.includes('triceps') ||
      lower.includes('forearm') ||
      lower.includes('hammer curl') ||
      lower.includes('preacher curl') ||
      lower.includes('concentration curl') ||
      lower.includes('pushdown') ||
      lower.includes('extension') ||
      lower.includes('dip') ||
      lower.includes('skull crusher') ||
      lower.includes('overhead extension') ||
      lower.includes('kickback')
    ) {
      return 'Arms';
    }

    // Chest exercises
    if (
      lower.includes('bench') ||
      (lower.includes('press') &&
        (lower.includes('chest') ||
          lower.includes('pec') ||
          lower.includes('incline') ||
          lower.includes('decline'))) ||
      lower.includes('fly') ||
      lower.includes('pec deck') ||
      lower.includes('pectoral') ||
      lower.includes('push-up') ||
      lower.includes('pushup') ||
      (lower.includes('dips') && lower.includes('chest'))
    ) {
      return 'Chest';
    }

    // Back exercises
    if (
      lower.includes('deadlift') ||
      lower.includes('row') ||
      lower.includes('pulldown') ||
      lower.includes('pull-up') ||
      lower.includes('pullup') ||
      lower.includes('chin-up') ||
      lower.includes('lat') ||
      lower.includes('trap') ||
      lower.includes('shrug') ||
      lower.includes('rear delt') ||
      lower.includes('face pull') ||
      lower.includes('cable row')
    ) {
      return 'Back';
    }

    // Shoulders exercises
    if (
      lower.includes('shoulder') ||
      lower.includes('deltoid') ||
      lower.includes('delt') ||
      lower.includes('lateral raise') ||
      lower.includes('front raise') ||
      lower.includes('rear raise') ||
      lower.includes('overhead press') ||
      lower.includes('ohp') ||
      lower.includes('arnold press') ||
      lower.includes('upright row') ||
      lower.includes('reverse fly')
    ) {
      return 'Shoulders';
    }

    // Legs exercises
    if (
      lower.includes('squat') ||
      lower.includes('leg press') ||
      lower.includes('lunge') ||
      lower.includes('leg curl') ||
      lower.includes('leg extension') ||
      lower.includes('calf') ||
      lower.includes('quad') ||
      lower.includes('hamstring') ||
      lower.includes('glute') ||
      lower.includes('hip thrust') ||
      lower.includes('romanian deadlift') ||
      lower.includes('rdl') ||
      lower.includes('bulgarian') ||
      lower.includes('step-up') ||
      lower.includes('hack squat')
    ) {
      return 'Legs';
    }

    // Core exercises
    if (
      lower.includes('crunch') ||
      lower.includes('sit-up') ||
      lower.includes('plank') ||
      lower.includes('ab') ||
      lower.includes('oblique') ||
      lower.includes('russian twist') ||
      lower.includes('leg raise') ||
      lower.includes('hanging') ||
      lower.includes('mountain climber') ||
      lower.includes('dead bug') ||
      lower.includes('bird dog') ||
      lower.includes('pallof press')
    ) {
      return 'Core';
    }

    return null;
  };

  // Helper function to normalize body part names to our standard categories
  const normalizeBodyPart = (
    bodyPart: string | null | undefined,
    exerciseName?: string
  ): keyof MuscleGroupData | null => {
    // First try to normalize the bodyPart field
    if (bodyPart) {
      const normalized = bodyPart.trim();

      // Direct matches
      if (
        normalized === 'Back' ||
        normalized === 'Chest' ||
        normalized === 'Core' ||
        normalized === 'Shoulders' ||
        normalized === 'Arms' ||
        normalized === 'Legs'
      ) {
        return normalized as keyof MuscleGroupData;
      }

      // Case-insensitive matching
      const lower = normalized.toLowerCase();

      // Handle "Full Body" - try to infer from name, otherwise skip
      if (
        lower.includes('full body') ||
        lower.includes('fullbody') ||
        lower === 'full'
      ) {
        // For full body exercises, try to infer primary muscle group from name
        if (exerciseName) {
          return inferBodyPartFromName(exerciseName);
        }
        return null; // Skip if we can't infer
      }

      if (
        lower.includes('back') ||
        lower.includes('lat') ||
        lower.includes('trap') ||
        lower.includes('rhomboid') ||
        lower.includes('rear delt')
      ) {
        return 'Back';
      }
      if (
        lower.includes('chest') ||
        lower.includes('pec') ||
        lower.includes('pectoral')
      ) {
        return 'Chest';
      }
      if (
        lower.includes('core') ||
        lower.includes('ab') ||
        lower.includes('oblique') ||
        lower.includes('abs') ||
        lower.includes('waist')
      ) {
        return 'Core';
      }
      if (
        lower.includes('shoulder') ||
        lower.includes('deltoid') ||
        lower.includes('delts')
      ) {
        return 'Shoulders';
      }
      if (
        lower.includes('arm') ||
        lower.includes('bicep') ||
        lower.includes('tricep') ||
        lower.includes('forearm') ||
        lower.includes('biceps') ||
        lower.includes('triceps')
      ) {
        return 'Arms';
      }
      if (
        lower.includes('leg') ||
        lower.includes('quad') ||
        lower.includes('hamstring') ||
        lower.includes('calf') ||
        lower.includes('calves') ||
        lower.includes('glute') ||
        lower.includes('thigh') ||
        lower.includes('hip') ||
        lower.includes('adductor') ||
        lower.includes('abductor')
      ) {
        return 'Legs';
      }
    }

    // If bodyPart is null or doesn't match, try to infer from exercise name
    if (exerciseName) {
      return inferBodyPartFromName(exerciseName);
    }

    return null;
  };

  // Helper function to fetch and count muscle groups
  const getMuscleGroupCounts = async (
    startDate: Date,
    endDate: Date
  ): Promise<MuscleGroupData> => {
    // Fetch workout items with their exercises and sets
    const workoutItems = await prisma.workout_items.findMany({
      where: {
        workout_sessions: {
          userId: user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      select: {
        exerciseId: true,
        customId: true,
        workout_sets: {
          select: {
            id: true, // Count sets, not just exercises
          },
        },
      },
    });

    // Get unique exercise IDs
    const exerciseIds = [
      ...new Set(
        workoutItems
          .filter((item) => item.exerciseId)
          .map((item) => item.exerciseId!)
      ),
    ];
    const customIds = [
      ...new Set(
        workoutItems
          .filter((item) => item.customId)
          .map((item) => item.customId!)
      ),
    ];

    // Fetch exercises with body parts
    const exercises = await prisma.exercises.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, bodyPart: true, name: true },
    });

    const customExercises = await prisma.custom_exercises.findMany({
      where: { id: { in: customIds } },
      select: { id: true, bodyPart: true, name: true },
    });

    // Create a map for quick lookup
    const exerciseBodyPartMap = new Map<string, keyof MuscleGroupData | null>();
    exercises.forEach((ex) => {
      // Try bodyPart first, then fall back to name inference
      const bodyPart = normalizeBodyPart(ex.bodyPart, ex.name);
      exerciseBodyPartMap.set(ex.id, bodyPart);
    });
    customExercises.forEach((ex) => {
      // Try bodyPart first, then fall back to name inference
      const bodyPart = normalizeBodyPart(ex.bodyPart, ex.name);
      exerciseBodyPartMap.set(ex.id, bodyPart);
    });

    // Initialize counts
    const counts: MuscleGroupData = {
      Back: 0,
      Chest: 0,
      Core: 0,
      Shoulders: 0,
      Arms: 0,
      Legs: 0,
    };

    // Count sets by body part (more accurate than counting exercises)
    workoutItems.forEach((item) => {
      const bodyPart = item.exerciseId
        ? exerciseBodyPartMap.get(item.exerciseId)
        : item.customId
          ? exerciseBodyPartMap.get(item.customId)
          : null;

      if (bodyPart && bodyPart in counts) {
        // Count the number of sets for this exercise
        const setCount = item.workout_sets.length;
        counts[bodyPart] += setCount;
      }
    });

    return counts;
  };

  // Get current and previous period data
  const [current, previous] = await Promise.all([
    getMuscleGroupCounts(currentStartDate, endDate),
    getMuscleGroupCounts(previousStartDate, previousEndDate),
  ]);

  // Find max value for normalization (0-100 scale)
  const allValues = [...Object.values(current), ...Object.values(previous)];
  const maxValue = Math.max(...allValues, 1); // At least 1 to avoid division by zero

  // Normalize to 0-100 scale
  const normalize = (value: number) => (value / maxValue) * 100;

  const currentNormalized: MuscleGroupData = {
    Back: normalize(current.Back),
    Chest: normalize(current.Chest),
    Core: normalize(current.Core),
    Shoulders: normalize(current.Shoulders),
    Arms: normalize(current.Arms),
    Legs: normalize(current.Legs),
  };

  const previousNormalized: MuscleGroupData = {
    Back: normalize(previous.Back),
    Chest: normalize(previous.Chest),
    Core: normalize(previous.Core),
    Shoulders: normalize(previous.Shoulders),
    Arms: normalize(previous.Arms),
    Legs: normalize(previous.Legs),
  };

  return NextResponse.json({
    current: currentNormalized,
    previous: previousNormalized,
    currentRaw: current,
    previousRaw: previous,
    maxValue,
  });
}
