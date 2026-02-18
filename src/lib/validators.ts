import { z } from 'zod';

/** Minimum password length */
export const PASSWORD_MIN = 8;

/** Regex: at least one lowercase, one uppercase, one digit */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * Validate password strength. Returns error message or null if valid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN)
    return `At least ${PASSWORD_MIN} characters`;
  if (!PASSWORD_REGEX.test(password))
    return 'Include uppercase, lowercase, and a number';
  return null;
}

/**
 * Activity entry validation schema
 */
export const activitySchema = z.object({
  date: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  steps: z.number().min(0),
  distanceKm: z.number().min(0),
  calories: z.number().min(0),
  heartRateAvg: z.number().min(30).max(220).optional(),
  workouts: z.number().min(0).max(5),
});

/** Date range: day | week | month */
export const rangeSchema = z.enum(['day', 'week', 'month']);
export type DateRange = z.infer<typeof rangeSchema>;
export const dateQuerySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Profile update validation schema
 */
export const profileUpdateSchema = z.object({
  name: z.string().max(100).optional(),
  unitPreference: z.enum(['metric', 'imperial']).optional(),
  themePreference: z.enum(['system', 'light', 'dark']).optional(),
});

/**
 * User preferences update validation schema
 */
export const preferencesUpdateSchema = z.object({
  defaultRestSeconds: z.number().int().min(10).max(600),
});

/**
 * Workout set validation (shared by create, update, import)
 */
export const workoutSetSchema = z.object({
  setNumber: z.number().int().min(1),
  weightKg: z.number().nonnegative().optional(),
  reps: z.number().int().min(1).max(100),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().max(200).optional(),
});

/**
 * Workout item with exerciseId or customId (create/update)
 */
export const workoutItemSchema = z.union([
  z.object({
    exerciseId: z.string().min(1),
    sets: z.array(workoutSetSchema).min(1),
  }),
  z.object({
    customId: z.string().min(1),
    sets: z.array(workoutSetSchema).min(1),
  }),
]);

/**
 * Workout item for CSV import (uses exerciseName)
 */
export const workoutImportItemSchema = z.object({
  exerciseName: z.string().min(1),
  sets: z.array(workoutSetSchema).min(1),
});

/**
 * Create workout validation
 */
export const createWorkoutSchema = z.object({
  date: z.string().datetime().optional(),
  title: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(workoutItemSchema).min(1),
});

/**
 * Update workout validation
 */
export const updateWorkoutSchema = z.object({
  date: z.string().datetime().optional(),
  title: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(workoutItemSchema).min(1).optional(),
});

/**
 * Import workout validation
 */
export const importWorkoutSchema = z.object({
  date: z.string().datetime(),
  title: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(workoutImportItemSchema).min(1),
});

export const bulkImportSchema = z.object({
  workouts: z.array(importWorkoutSchema).min(1),
});

/**
 * Routine item (exercise + set count, no weight/reps)
 */
export const routineItemSchema = z.union([
  z.object({ exerciseId: z.string().min(1), setCount: z.number().int().min(1).max(20) }),
  z.object({ customId: z.string().min(1), setCount: z.number().int().min(1).max(20) }),
]);

export const createRoutineSchema = z.object({
  name: z.string().min(1).max(80),
  items: z.array(routineItemSchema).min(1),
});

export const updateRoutineSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  items: z.array(routineItemSchema).min(1).optional(),
});

/**
 * Type inference from schemas
 */
export type ActivityInput = z.infer<typeof activitySchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PreferencesUpdateInput = z.infer<typeof preferencesUpdateSchema>;
