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
 * Type inference from schemas
 */
export type ActivityInput = z.infer<typeof activitySchema>;
export type DateRange = z.infer<typeof rangeSchema>;

