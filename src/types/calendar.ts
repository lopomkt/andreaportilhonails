
export type CalendarView = 'day' | 'week' | 'month';

export interface DayStats {
  appointmentsCount: number;
  blocksCount: number;
  occupancyPercentage: number;
  isFullDayBlocked: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  duration?: number;
  type: 'appointment' | 'block';
  status?: 'pending' | 'confirmed' | 'canceled';
}

export interface TimeSlot {
  time: Date;
  available: boolean;
  appointments: any[];
  isBlocked: boolean;
}

export interface WeekViewData {
  weekStart: Date;
  weekEnd: Date;
  days: Date[];
}
