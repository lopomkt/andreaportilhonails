
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
 * Calculates the time difference between two dates in minutes
 */
export const calculateDurationInMinutes = (startDate: Date, endDate: Date): number => {
  const diffInMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffInMs / (1000 * 60));
};

/**
 * Groups appointments by month for reporting purposes
 */
export const groupAppointmentsByMonth = (appointments: any[], filterByConfirmed = true) => {
  const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));
  
  const grouped = months.map(month => {
    const monthIndex = months.indexOf(month);
    const filteredAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      const isCorrectMonth = appointmentDate.getMonth() === monthIndex;
      return filterByConfirmed ? isCorrectMonth && appointment.status === 'confirmed' : isCorrectMonth;
    });
    
    return {
      month,
      count: filteredAppointments.length,
      revenue: filteredAppointments.reduce((sum, appt) => sum + appt.price, 0)
    };
  });
  
  return grouped;
};

/**
 * Check if a date is today or in the future
 * Useful for filtering future appointments
 */
export const isTodayOrFuture = (date: Date): boolean => {
  const today = new Date();
  const normalizedToday = normalizeDateNoon(today);
  const normalizedDate = normalizeDateNoon(date);
  
  return normalizedDate >= normalizedToday;
};

/**
 * Get confirmed future appointments
 * Returns only appointments that are today or in the future with status "confirmed"
 */
export const getConfirmedFutureAppointments = (appointments: any[]): any[] => {
  return appointments.filter(appointment => {
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
  if (minutes < 1) return "0m";
  
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
 * Calculates percentage change between two numbers
 * @param current Current value
 * @param previous Previous value
 * @returns Formatted percentage string with sign (e.g. "+12%" or "-8%")
 */
export const calculatePercentageChange = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? "+100%" : "0%";
  }
  
  const percentChange = ((current - previous) / previous) * 100;
  const sign = percentChange > 0 ? '+' : '';
  return `${sign}${percentChange.toFixed(0)}%`;
};

/**
 * Gets the day of week distribution for appointments
 * @param appointments Array of appointments
 * @returns Object with count for each day (0-6, where 0 is Sunday)
 */
export const getDayOfWeekDistribution = (appointments: any[]): number[] => {
  // Initialize with zeros for each day (Sunday-Saturday)
  const distribution = [0, 0, 0, 0, 0, 0, 0];
  
  appointments.forEach(appointment => {
    const appointmentDate = new Date(appointment.date);
    const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 6 = Saturday
    distribution[dayOfWeek]++;
  });
  
  return distribution;
};

/**
 * Gets the hour distribution for appointments
 * @param appointments Array of appointments
 * @returns Object with count for each hour (0-23)
 */
export const getHourDistribution = (appointments: any[]): number[] => {
  // Initialize with zeros for each hour (0-23)
  const distribution = Array(24).fill(0);
  
  appointments.forEach(appointment => {
    const appointmentDate = new Date(appointment.date);
    const hour = appointmentDate.getHours();
    distribution[hour]++;
  });
  
  return distribution;
};
