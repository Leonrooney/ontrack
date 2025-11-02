import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths } from 'date-fns';

export type DateRange = 'day' | 'week' | 'month';

export interface RangeBounds {
  start: Date;
  end: Date;
}

/**
 * Get start and end dates for a given range and anchor date
 */
export function getRangeBounds(range: DateRange, anchorDate: Date = new Date()): RangeBounds {
  const baseDate = startOfDay(anchorDate);

  switch (range) {
    case 'day':
      return {
        start: startOfDay(baseDate),
        end: endOfDay(baseDate),
      };
    
    case 'week':
      return {
        start: startOfWeek(baseDate, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(baseDate, { weekStartsOn: 1 }), // Sunday
      };
    
    case 'month':
      return {
        start: startOfMonth(baseDate),
        end: endOfMonth(baseDate),
      };
    
    default:
      return { start: baseDate, end: baseDate };
  }
}

/**
 * Navigate to previous period
 */
export function getPreviousPeriod(range: DateRange, anchorDate: Date): Date {
  switch (range) {
    case 'day':
      return subDays(anchorDate, 1);
    case 'week':
      return subWeeks(anchorDate, 1);
    case 'month':
      return subMonths(anchorDate, 1);
    default:
      return anchorDate;
  }
}

/**
 * Navigate to next period
 */
export function getNextPeriod(range: DateRange, anchorDate: Date): Date {
  switch (range) {
    case 'day':
      return addDays(anchorDate, 1);
    case 'week':
      return addWeeks(anchorDate, 1);
    case 'month':
      return addMonths(anchorDate, 1);
    default:
      return anchorDate;
  }
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = startOfDay(new Date());
  const checkDate = startOfDay(date);
  return today.getTime() === checkDate.getTime();
}

