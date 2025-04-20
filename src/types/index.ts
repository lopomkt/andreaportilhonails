
// Types related to appointments
export type AppointmentStatus = 'confirmed' | 'pending' | 'canceled';

export interface Appointment {
  id: string;
  client?: Client;
  clientId: string;
  service?: Service;
  serviceId: string;
  date: string; // ISO format string
  endTime: string;
  price: number;
  status: AppointmentStatus;
  createdAt?: string;
  updatedAt?: string;
  blockTotal?: boolean;
  confirmationMessage?: string;
  notes?: string;
  cancellationReason?: string;
}

// Types related to clients
export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  lastAppointment?: string; // ISO format string
  totalSpent?: number;
  createdAt?: string;
}

// Types related to services
export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
}

// Types related to blocked dates
export interface BlockedDate {
  id: string;
  date: string; // ISO format string
  reason?: string;
  description?: string;
  value?: string;
  dia_todo: boolean;
  allDay: boolean; // Added to match usage
  motivo?: string; // Added to match usage
}

// Types related to the calendar
export type CalendarView = 'day' | 'week' | 'month';

// Types related to message templates
export interface MessageTemplate {
  id: string;
  type: string;
  message: string;
  active: boolean;
}

// Types related to absences
export interface AbsenceRule {
  id: string;
  date: string; // ISO format string
  startTime?: string;
  endTime?: string;
  reason: string;
  allDay: boolean;
}

// Types related to cancellation reasons
export interface CancellationReason {
  id: string;
  reason: string;
}

// Types related to expenses
export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO format string
  isRecurring: boolean;
  category?: string;
  notes?: string;
}

// Types related to dashboard statistics
export interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  monthRevenue: number;
  inactiveClients: number;
}

// Types related to revenue data
export interface MonthlyRevenueData {
  name: string;
  month: number;
  revenue: number;
  expenses: number;
  profit: number;
}

// Types related to WhatsApp messaging
export interface WhatsAppMessageData {
  client?: Client;
  appointment?: Appointment;
  message?: string;
}
