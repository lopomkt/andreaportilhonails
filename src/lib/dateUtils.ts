
/**
 * Unified date utilities with consistent noon normalization
 * This prevents timezone-related bugs across the application
 */

/**
 * Normalizes a date by setting the time component to noon (12:00)
 * This helps prevent issues with timezone handling
 */
export const normalizeDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
};

/**
 * Standard normalization function to use across the application
 * Always sets time to noon (12:00) to avoid timezone issues
 */
export const normalizeDateNoon = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
};

/**
 * Creates a new date with noon (12:00) time setting to avoid timezone issues
 * @param year The year
 * @param month The month (0-11)
 * @param day The day of month, defaults to 1
 * @returns A new Date object set to noon time
 */
export const createDateWithNoon = (year: number, month: number, day: number = 1): Date => {
  return new Date(year, month, day, 12, 0, 0, 0);
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

/**
 * Safely compares two dates ignoring time, using noon normalization
 */
export const isSameDateSafe = (date1: Date, date2: Date): boolean => {
  const norm1 = normalizeDateNoon(date1);
  const norm2 = normalizeDateNoon(date2);
  return norm1.getTime() === norm2.getTime();
};

/**
 * Gets start of day with noon normalization for consistent comparisons
 */
export const getStartOfDaySafe = (date: Date): Date => {
  const normalized = normalizeDateNoon(date);
  return new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate(), 0, 0, 0, 0);
};

/**
 * Gets end of day with noon normalization for consistent comparisons
 */
export const getEndOfDaySafe = (date: Date): Date => {
  const normalized = normalizeDateNoon(date);
  return new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate(), 23, 59, 59, 999);
};

/**
 * Calculates the time difference between two dates in minutes
 */
export const calculateDurationInMinutes = (startDate: Date, endDate: Date): number => {
  const diffInMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffInMs / (1000 * 60));
};

/**
 * Check if a date is today or in the future (safe comparison)
 */
export const isTodayOrFuture = (date: Date): boolean => {
  const today = normalizeDateNoon(new Date());
  const normalizedDate = normalizeDateNoon(date);
  
  return normalizedDate >= today;
};

/**
 * Get confirmed future appointments with safe date comparison
 */
export const getConfirmedFutureAppointments = (appointments: any[]): any[] => {
  if (!appointments || !Array.isArray(appointments)) return [];
  
  return appointments.filter(appointment => {
    if (!appointment?.date || !appointment?.status) return false;
    
    const appointmentDate = new Date(appointment.date);
    return appointment.status === 'confirmed' && isTodayOrFuture(appointmentDate);
  });
};

/**
 * Formats time duration into user-friendly format
 * @param minutes Total minutes
 * @returns Formatted string (e.g. "1d 2h 30m" or "2h 30m")
 */
export const formatTimeDuration = (minutes: number): string => {
  if (!minutes || minutes < 1) return "0m";
  
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (mins > 0 || (days === 0 && hours === 0)) result += `${mins}m`;
  
  return result.trim();
};

/**
 * Calculates percentage change between two numbers safely
 */
export const calculatePercentageChange = (current: number, previous: number): string => {
  if (!current && !previous) return "0%";
  if (previous === 0) {
    return current > 0 ? "+100%" : "0%";
  }
  
  const percentChange = ((current - previous) / previous) * 100;
  const sign = percentChange > 0 ? '+' : '';
  return `${sign}${percentChange.toFixed(0)}%`;
};

/**
 * Groups appointments by month with safe date handling
 */
export const groupAppointmentsByMonth = (appointments: any[], filterByConfirmed = true) => {
  if (!appointments || !Array.isArray(appointments)) return [];
  
  const months = Array.from({ length: 12 }, (_, i) => 
    new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })
  );
  
  return months.map((month, monthIndex) => {
    const filteredAppointments = appointments.filter(appointment => {
      if (!appointment?.date) return false;
      
      const appointmentDate = normalizeDateNoon(new Date(appointment.date));
      const isCorrectMonth = appointmentDate.getMonth() === monthIndex;
      
      if (filterByConfirmed) {
        return isCorrectMonth && appointment.status === 'confirmed';
      }
      return isCorrectMonth;
    });
    
    const revenue = filteredAppointments.reduce((sum, appt) => {
      return sum + (appt?.price || 0);
    }, 0);
    
    return {
      month,
      count: filteredAppointments.length,
      revenue
    };
  });
};

/**
 * Gets the day of week distribution for appointments with safe handling
 */
export const getDayOfWeekDistribution = (appointments: any[]): number[] => {
  if (!appointments || !Array.isArray(appointments)) return [0, 0, 0, 0, 0, 0, 0];
  
  const distribution = [0, 0, 0, 0, 0, 0, 0];
  
  appointments.forEach(appointment => {
    if (!appointment?.date) return;
    
    try {
      const appointmentDate = normalizeDateNoon(new Date(appointment.date));
      const dayOfWeek = appointmentDate.getDay();
      if (dayOfWeek >= 0 && dayOfWeek <= 6) {
        distribution[dayOfWeek]++;
      }
    } catch (error) {
      console.warn('Invalid date in appointment:', appointment);
    }
  });
  
  return distribution;
};

/**
 * Gets the hour distribution for appointments with safe handling
 */
export const getHourDistribution = (appointments: any[]): number[] => {
  if (!appointments || !Array.isArray(appointments)) return Array(24).fill(0);
  
  const distribution = Array(24).fill(0);
  
  appointments.forEach(appointment => {
    if (!appointment?.date) return;
    
    try {
      const appointmentDate = new Date(appointment.date);
      const hour = appointmentDate.getHours();
      if (hour >= 0 && hour <= 23) {
        distribution[hour]++;
      }
    } catch (error) {
      console.warn('Invalid date in appointment:', appointment);
    }
  });
  
  return distribution;
};

/**
 * Validates if a date is valid and safe to use
 */
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Safely parses a date string or Date object
 */
export const safeDateParse = (dateInput: string | Date | null | undefined): Date | null => {
  if (!dateInput) return null;
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return isValidDate(date) ? normalizeDateNoon(date) : null;
  } catch {
    return null;
  }
};
