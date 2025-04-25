// Types related to appointments
export type AppointmentStatus = 'pending' | 'confirmed' | 'canceled';
export type ConfirmationStatus = 'not_confirmed' | 'confirmed' | 'canceled';

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  date: string | Date;
  price: number;
  status: AppointmentStatus;
  endTime?: string | Date | null;
  cancellationReason?: string | null;
  notes?: string | null;
  client?: Client;
  service?: Service;
  confirmationStatus?: ConfirmationStatus;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthdate?: string; // ISO format string for birthdate
  notes?: string;
  lastAppointment?: string; // ISO format string
  totalSpent?: number;
  createdAt?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
}

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

export type CalendarView = 'day' | 'week' | 'month';

export interface MessageTemplate {
  id: string;
  type: string;
  message: string;
  active: boolean;
}

export interface AbsenceRule {
  id: string;
  date: string; // ISO format string
  startTime?: string;
  endTime?: string;
  reason: string;
  allDay: boolean;
}

export interface CancellationReason {
  id: string;
  reason: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO format string
  category?: string;
  isRecurring: boolean;
  notes?: string;
}

export interface DashboardStats {
  monthRevenue: number;
  newClients: number;
  totalAppointments: number;
  inactiveClients: number;
  todayAppointments: number;
  weekAppointments: number;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  expenses?: number;
  profit?: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface WhatsAppMessageData {
  client?: Client;
  message?: string;
  appointment?: Appointment;
}

export interface RefetchFunction {
  (): Promise<any>;
}

export interface ServiceResponse<T> {
  data?: T;
  error?: any;
}

export interface ExpenseFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  expense?: Expense | null;
}
