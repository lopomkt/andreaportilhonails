
import { Tables, TablesRow, TablesInsert, TablesUpdate } from './type-utils';
import { Database } from './types';

// Type aliases for Supabase tables
export type DbAppointment = TablesRow<'agendamentos_novo'> & {
  status_confirmacao?: string;  // Added missing field
  motivo_cancelamento?: string; // Added missing field
};
export type DbClient = TablesRow<'clientes'>;
export type DbService = TablesRow<'servicos'>;
export type DbConfig = TablesRow<'configuracoes'>;
export type DbMotivationalMessage = TablesRow<'mensagens_motivacionais'>;
export type DbLastViewedMessage = TablesRow<'ultima_mensagem_vista'>;
export type DbMessageTemplate = TablesRow<'mensagens_templates'>;

// Appointment-specific types for insert and update operations
export type DbAppointmentInsert = TablesInsert<'agendamentos_novo'> & {
  status_confirmacao?: string;  // Added missing field
  motivo_cancelamento?: string; // Added missing field
};
export type DbAppointmentUpdate = TablesUpdate<'agendamentos_novo'> & {
  status_confirmacao?: string;  // Added missing field
  motivo_cancelamento?: string; // Added missing field
};

// Define type for blocked dates
export interface DbBlockedDate extends TablesRow<'datas_bloqueadas'> {}

// Define insert and update types for blocked dates
export type DbBlockedDateInsert = TablesInsert<'datas_bloqueadas'>;
export type DbBlockedDateUpdate = TablesUpdate<'datas_bloqueadas'>;

// Motivational message types
export type DbMotivationalMessageInsert = TablesInsert<'mensagens_motivacionais'>;
export type DbMotivationalMessageUpdate = TablesUpdate<'mensagens_motivacionais'>;

// Last viewed message types
export type DbLastViewedMessageInsert = TablesInsert<'ultima_mensagem_vista'>;
export type DbLastViewedMessageUpdate = TablesUpdate<'ultima_mensagem_vista'>;

// Cancellation reason types
export type DbCancellationReason = TablesRow<'motivos_cancelamento'>;
export type DbCancellationReasonInsert = TablesInsert<'motivos_cancelamento'>;
export type DbCancellationReasonUpdate = TablesUpdate<'motivos_cancelamento'>;

// Message template types
export type DbMessageTemplateInsert = TablesInsert<'mensagens_templates'>;
export type DbMessageTemplateUpdate = TablesUpdate<'mensagens_templates'>;
