
/**
 * Normalizes a date by removing the time component
 * This helps prevent issues with timezone handling
 */
export const normalizeDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * Creates a clone of a date to prevent mutation issues
 */
export const cloneDate = (date: Date): Date => {
  return new Date(date.getTime());
};

/**
 * Formats a date to YYYY-MM-DD format, useful for URL params and DB operations
 */
export const formatDateParam = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
