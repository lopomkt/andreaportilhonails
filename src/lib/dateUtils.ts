
/**
 * Normalizes a date by removing the time component
 * This helps prevent issues with timezone handling
 */
export const normalizeDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
