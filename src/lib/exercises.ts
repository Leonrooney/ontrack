/**
 * Exercise-related utility functions and constants
 */

/**
 * Muscle group filter options for exercise filtering
 * Maps muscle values to their corresponding body part categories
 */
export const MUSCLE_OPTIONS = [
  { value: 'all', label: 'All muscles' },
  { value: 'abdominals', label: 'Abdominals', bodyPart: 'Core' },
  { value: 'obliques', label: 'Obliques', bodyPart: 'Core' },
  { value: 'lower_back', label: 'Lower Back', bodyPart: 'Back' },
  { value: 'lats', label: 'Lats', bodyPart: 'Back' },
  { value: 'middle_back', label: 'Middle Back', bodyPart: 'Back' },
  { value: 'upper_back', label: 'Upper Back', bodyPart: 'Back' },
  { value: 'quadriceps', label: 'Quadriceps', bodyPart: 'Legs' },
  { value: 'hamstrings', label: 'Hamstrings', bodyPart: 'Legs' },
  { value: 'glutes', label: 'Glutes', bodyPart: 'Legs' },
  { value: 'calves', label: 'Calves', bodyPart: 'Legs' },
  { value: 'chest', label: 'Chest', bodyPart: 'Chest' },
  { value: 'shoulders', label: 'Shoulders', bodyPart: 'Shoulders' },
  { value: 'biceps', label: 'Biceps', bodyPart: 'Arms' },
  { value: 'triceps', label: 'Triceps', bodyPart: 'Arms' },
  { value: 'forearms', label: 'Forearms', bodyPart: 'Arms' },
] as const;

/**
 * Converts a muscle filter value to its corresponding body part category
 * @param val - The muscle filter value (e.g., 'biceps', 'chest', 'all')
 * @returns The body part category string or null if 'all' or not found
 */
export function bodyPartFromMuscleValue(val: string): string | null {
  if (val === 'all') return null;
  const found = MUSCLE_OPTIONS.find((o) => o.value === val);
  // Type guard: check if the option has a bodyPart property
  return found && 'bodyPart' in found ? found.bodyPart : null;
}

/**
 * Maps body part filter values to possible database body part values
 * Used for case-insensitive filtering in database queries
 */
export const BODY_PART_MAP: Record<string, string[]> = {
  chest: ['Chest', 'chest', 'CHEST'],
  back: ['Back', 'back', 'BACK'],
  shoulders: ['Shoulders', 'shoulders', 'Shoulder', 'shoulder'],
  arms: ['Arms', 'arms', 'Arm', 'arm'],
  legs: ['Legs', 'legs', 'Leg', 'leg'],
  core: ['Core', 'core', 'CORE'],
  cardio: ['Cardio', 'cardio', 'CARDIO'],
  'full body': ['Full Body', 'full body', 'FullBody', 'fullbody'],
  fullbody: ['Full Body', 'full body', 'FullBody', 'fullbody'],
};

/**
 * Gets possible database values for a body part filter
 * @param bodyPart - The body part filter value (e.g., 'chest', 'back')
 * @returns Array of possible database values to match against
 */
export function getBodyPartFilterValues(bodyPart: string): string[] {
  const lower = bodyPart.toLowerCase();
  return (
    BODY_PART_MAP[lower] || [
      bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1).toLowerCase(),
      bodyPart.toLowerCase(),
      bodyPart.toUpperCase(),
    ]
  );
}
