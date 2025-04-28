
// Add this to your types file or update the existing BlockedDate type
export interface BlockedDate {
  id: string;
  date: string | Date;
  reason?: string;
  motivo?: string;
  description?: string;
  allDay: boolean;
  dia_todo: boolean;
  valor?: string; // To store start time
  descricao?: string; // To store end time
}

// Client type
export interface Client {
  id: string;
  name: string;
  nome?: string; // For database mapping
  phone: string;
  telefone?: string; // For database mapping
  email?: string;
  birthdate?: string | Date;
  data_nascimento?: string | Date; // For database mapping
  notes?: string;
  observacoes?: string; // For database mapping
  lastAppointment?: string | Date;
  data_ultimo_agendamento?: string | Date; // For database mapping
  totalSpent?: number;
  valor_total?: number; // For database mapping
  createdAt?: string | Date; // Add this field to support existing code
}

// Appointment Status
export type AppointmentStatus = "pending" | "confirmed" | "canceled";

// Appointment type
export interface Appointment {
  id: string;
  clientId: string;
  cliente_id?: string; // For database mapping
  serviceId: string;
  servico_id?: string; // For database mapping
  date: string | Date;
  data?: string | Date; // For database mapping
  endTime?: string | Date;
  hora_fim?: string | Date; // For database mapping
  price: number;
  preco?: number; // For database mapping
  status: AppointmentStatus;
  notes?: string;
  observacoes?: string; // For database mapping
  cancellationReason?: string;
  motivo_cancelamento?: string; // For database mapping
  client?: Client;
  service?: Service;
  created_at?: string;
  confirmationStatus?: 'confirmed' | 'not_confirmed' | 'canceled'; // Add this field to support existing code
}

// Service type
export interface Service {
  id: string;
  name: string;
  nome?: string; // For database mapping
  description?: string;
  descricao?: string; // For database mapping
  durationMinutes: number;
  duracao_minutos?: number; // For database mapping
  price: number;
  preco?: number; // For database mapping
}

// Expense type
export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string | Date;
  isRecurring: boolean;
  category?: string;
  notes?: string;
}

// Dashboard Statistics
export interface DashboardStats {
  monthRevenue: number;
  newClients: number;
  totalAppointments: number;
  inactiveClients: number;
  todayAppointments: number;
  weekAppointments: number;
}

// Revenue Data for charts
export interface RevenueData {
  name: string;
  revenue: number;
  expenses: number;
  date: string;
  month?: string | number; // Add this field to support existing code
}

// Monthly Revenue Data type
export interface MonthlyRevenueData {
  month: string | number;
  revenue: number;
  expenses?: number;
  profit?: number;
}

// WhatsApp Message Data
export interface WhatsAppMessageData {
  phone: string;
  message: string;
  clientName?: string;
  appointmentDate?: string | Date;
  client?: Client; // Add this field to support existing code
  appointment?: Appointment; // Add this field to support existing code
}

// Message Template
export interface MessageTemplate {
  id: string;
  message: string;
  tipo: string;
  type?: string; // Add this field to support existing code
  created_at?: string;
  active?: boolean; // Add this field to support existing code
}

// Service Response
export interface ServiceResponse<T = any> {
  data?: T;
  error?: string;
}

// ClientWithRank for ranking components
export interface ClientWithRank extends Client {
  rank: number;
  appointmentCount: number;
  badge?: string | null; // Add badge property
  totalSpent: number; // Make totalSpent required
}

// Database types for Supabase
export interface DbBlockedDate {
  id: string;
  data: string;
  motivo?: string;
  descricao?: string;
  dia_todo: boolean;
  valor?: string;
}
