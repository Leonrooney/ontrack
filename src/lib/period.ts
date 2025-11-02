import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

export type GoalPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface PeriodBounds {
  start: Date;
  end: Date;
}

/**
 * Get start and end dates for a given goal period and anchor date
 */
export function getPeriodBounds(period: GoalPeriod, anchorDate: Date = new Date()): PeriodBounds {
  const baseDate = startOfDay(anchorDate);

  switch (period) {
    case 'DAILY':
      return {
        start: startOfDay(baseDate),
        end: endOfDay(baseDate),
      };
    
    case 'WEEKLY':
      return {
        start: startOfWeek(baseDate, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(baseDate, { weekStartsOn: 1 }), // Sunday
      };
    
    case 'MONTHLY':
      return {
        start: startOfMonth(baseDate),
        end: endOfMonth(baseDate),
      };
    
    default:
      return { start: baseDate, end: baseDate };
  }
}

/**
 * List previous periods
 */
export function listPreviousPeriods(
  period: GoalPeriod,
  count: number,
  anchorDate: Date = new Date()
): PeriodBounds[] {
  const periods: PeriodBounds[] = [];
  let currentDate = anchorDate;

  for (let i = 0; i < count; i++) {
    const bounds = getPeriodBounds(period, currentDate);
    periods.unshift(bounds); // Add to beginning to maintain chronological order
    
    // Move to previous period
    switch (period) {
      case 'DAILY':
        currentDate = subDays(currentDate, 1);
        break;
      case 'WEEKLY':
        currentDate = subWeeks(currentDate, 1);
        break;
      case 'MONTHLY':
        currentDate = subMonths(currentDate, 1);
        break;
    }
  }

  return periods;
}

/**
 * Check if current period is today's period
 */
export function isCurrentPeriod(period: GoalPeriod, date: Date): boolean {
  const todayBounds = getPeriodBounds(period, new Date());
  const bounds = getPeriodBounds(period, date);
  
  return (
    todayBounds.start.getTime() === bounds.start.getTime() &&
    todayBounds.end.getTime() === bounds.end.getTime()
  );
}

