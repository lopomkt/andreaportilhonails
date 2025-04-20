
import { Database } from './types';
import { Appointment, AppointmentStatus, Client, Service, BlockedDate } from '@/types';
import { DbAppointment, DbClient, DbService, DbBlockedDate } from './types/database-types';

// Map Supabase status to our application status
export const mapDbStatusToAppStatus = (dbStatus: Database['public']['Enums']['status_agendamento']): AppointmentStatus => {
  switch (dbStatus) {
    case 'confirmado': return 'confirmed';
    case 'pendente': return 'pending';
    case 'cancelado': return 'canceled';
    default: return 'pending';
  }
};

// Map our application status to Supabase status
export const mapAppStatusToDbStatus = (status: AppointmentStatus): Database['public']['Enums']['status_agendamento'] => {
  switch (status) {
    case 'confirmed': return 'confirmado';
    case 'pending': return 'pendente';
    case 'canceled': return 'cancelado';
    default: return 'pendente';
  }
};

// Convert Supabase appointment to our application Appointment type
export const mapDbAppointmentToApp = (dbAppointment: DbAppointment, client?: DbClient, service?: DbService): Appointment => {
  return {
    id: dbAppointment.id,
    clientId: dbAppointment.cliente_id,
    serviceId: dbAppointment.servico_id,
    date: dbAppointment.data,
    endTime: dbAppointment.hora_fim || new Date(new Date(dbAppointment.data).getTime() + (service?.duracao_minutos || 60) * 60000).toISOString(),
    status: mapDbStatusToAppStatus(dbAppointment.status),
    notes: dbAppointment.observacoes || undefined,
    price: Number(dbAppointment.preco),
    client: client ? mapDbClientToApp(client) : undefined,
    service: service ? mapDbServiceToApp(service) : undefined,
    cancellationReason: dbAppointment.motivo_cancelamento || undefined
  };
};

// Convert our application Appointment to Supabase format for insert/update
export const mapAppAppointmentToDb = (appointment: Partial<Appointment>): Partial<DbAppointment> => {
  const dbAppointment: Partial<DbAppointment> = {};
  
  if (appointment.id) dbAppointment.id = appointment.id;
  if (appointment.clientId) dbAppointment.cliente_id = appointment.clientId;
  if (appointment.serviceId) dbAppointment.servico_id = appointment.serviceId;
  if (appointment.date) dbAppointment.data = appointment.date;
  if (appointment.endTime) dbAppointment.hora_fim = appointment.endTime;
  if (appointment.notes) dbAppointment.observacoes = appointment.notes;
  if (appointment.price !== undefined) dbAppointment.preco = appointment.price;
  if (appointment.status) dbAppointment.status = mapAppStatusToDbStatus(appointment.status);
  if (appointment.cancellationReason) dbAppointment.motivo_cancelamento = appointment.cancellationReason;
  
  return dbAppointment;
};

// Convert Supabase client to our application Client type
export const mapDbClientToApp = (dbClient: DbClient): Client => {
  return {
    id: dbClient.id,
    name: dbClient.nome,
    phone: dbClient.telefone,
    email: dbClient.email || undefined,
    notes: dbClient.observacoes || undefined,
    lastAppointment: dbClient.ultimo_agendamento || undefined,
    totalSpent: Number(dbClient.valor_total || 0),
    createdAt: dbClient.data_criacao || new Date().toISOString()
  };
};

// Convert our application Client to Supabase format for insert/update
export const mapAppClientToDb = (client: Partial<Client>): Partial<DbClient> => {
  const dbClient: Partial<DbClient> = {};
  
  if (client.id) dbClient.id = client.id;
  if (client.name) dbClient.nome = client.name;
  if (client.phone) dbClient.telefone = client.phone;
  if (client.email) dbClient.email = client.email;
  if (client.notes) dbClient.observacoes = client.notes;
  if (client.lastAppointment) dbClient.ultimo_agendamento = client.lastAppointment;
  if (client.totalSpent !== undefined) dbClient.valor_total = client.totalSpent;
  
  return dbClient;
};

// Convert Supabase service to our application Service type
export const mapDbServiceToApp = (dbService: DbService): Service => {
  return {
    id: dbService.id,
    name: dbService.nome,
    price: Number(dbService.preco),
    durationMinutes: dbService.duracao_minutos,
    description: dbService.descricao || undefined
  };
};

// Convert our application Service to Supabase format for insert/update
export const mapAppServiceToDb = (service: Partial<Service>): Partial<DbService> => {
  const dbService: Partial<DbService> = {};
  
  if (service.id) dbService.id = service.id;
  if (service.name) dbService.nome = service.name;
  if (service.price !== undefined) dbService.preco = service.price;
  if (service.durationMinutes !== undefined) dbService.duracao_minutos = service.durationMinutes;
  if (service.description) dbService.descricao = service.description;
  
  return dbService;
};

// Map DbBlockedDate to BlockedDate
export const mapDbBlockedDateToApp = (dbBlockedDate: DbBlockedDate): BlockedDate => {
  return {
    id: dbBlockedDate.id,
    date: dbBlockedDate.data,
    reason: dbBlockedDate.motivo || undefined,
    allDay: dbBlockedDate.dia_todo,
    description: dbBlockedDate.descricao || undefined,
    value: dbBlockedDate.valor || undefined,
    dia_todo: dbBlockedDate.dia_todo,
    motivo: dbBlockedDate.motivo || undefined
  };
};

// Map BlockedDate to DbBlockedDate
export const mapAppBlockedDateToDb = (blockedDate: Partial<BlockedDate>): Partial<DbBlockedDate> => {
  const dbBlockedDate: Partial<DbBlockedDate> = {};
  
  if (blockedDate.id) dbBlockedDate.id = blockedDate.id;
  if (blockedDate.date) dbBlockedDate.data = blockedDate.date;
  if (blockedDate.reason) dbBlockedDate.motivo = blockedDate.reason;
  if (blockedDate.description) dbBlockedDate.descricao = blockedDate.description;
  if (blockedDate.value) dbBlockedDate.valor = blockedDate.value;
  if (blockedDate.allDay !== undefined) dbBlockedDate.dia_todo = blockedDate.allDay;
  if (blockedDate.dia_todo !== undefined && blockedDate.allDay === undefined) dbBlockedDate.dia_todo = blockedDate.dia_todo;
  
  return dbBlockedDate;
};
