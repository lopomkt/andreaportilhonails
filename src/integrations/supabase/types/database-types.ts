
import { Database } from '../types';

// Type aliases for Supabase tables
export type DbAppointment = Database['public']['Tables']['agendamentos']['Row'];
export type DbClient = Database['public']['Tables']['clientes']['Row'];
export type DbService = Database['public']['Tables']['servicos']['Row'];
export type DbConfig = Database['public']['Tables']['configuracoes']['Row'];

// Appointment-specific types for insert and update operations
export type DbAppointmentInsert = Database['public']['Tables']['agendamentos']['Insert'];
export type DbAppointmentUpdate = Database['public']['Tables']['agendamentos']['Update'];

// Define type for blocked dates
// For proper typing of the datas_bloqueadas table
export interface DbBlockedDate {
  id: string;
  data: string;
  motivo: string | null;
  dia_todo: boolean;
  valor?: string | null;
  descricao?: string | null;
}

// Define insert and update types for blocked dates
export interface DbBlockedDateInsert {
  id?: string;
  data: string;
  motivo?: string | null;
  dia_todo?: boolean;
  valor?: string | null;
  descricao?: string | null;
}

export interface DbBlockedDateUpdate {
  id?: string;
  data?: string;
  motivo?: string | null;
  dia_todo?: boolean;
  valor?: string | null;
  descricao?: string | null;
}
