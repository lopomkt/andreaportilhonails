
/**
 * Normalizes a date by setting the time component to noon (12:00)
 * This helps prevent issues with timezone handling
 */
export const normalizeDate = (date: Date): Date => {
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
