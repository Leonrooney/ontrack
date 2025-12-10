import { z } from 'zod';

/**
 * Activity entry validation schema
 */
export const activitySchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  steps: z.number().min(0),
  distanceKm: z.number().min(0),
  calories: z.number().min(0),
  heartRateAvg: z.number().min(30).max(220).optional(),
  workouts: z.number().min(0).max(5),
});

/**
 * Date range validation
 */
export const rangeSchema = z.enum(['day', 'week', 'month']);
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
 * Type inference from schemas
 */
export type ActivityInput = z.infer<typeof activitySchema>;
export type DateRange = z.infer<typeof rangeSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PreferencesUpdateInput = z.infer<typeof preferencesUpdateSchema>;
