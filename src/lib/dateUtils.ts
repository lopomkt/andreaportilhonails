
import { addMinutes } from 'date-fns';

/**
 * Calculates the end time for an appointment based on start date and duration
 */
export function calculateEndTimeFromDate(startDate: Date, durationMinutes: number): Date {
  return addMinutes(startDate, durationMinutes);
}

/**
 * Normalizes a date to midnight to avoid timezone issues
 */
export function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Formats a time string (HH:mm) from a date object
 */
export function formatTimeFromDate(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Creates a date object from a date and time string
 */
export function createDateFromDateAndTime(dateObj: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const resultDate = new Date(dateObj);
  resultDate.setHours(hours, minutes, 0, 0);
  return resultDate;
}
