import { Appointment, Client, Service } from '@/types';
import { DbAppointment, DbClient, DbService } from './database-types';

export function mapDbAppointmentToApp(
  dbAppointment: DbAppointment,
  dbClient?: DbClient,
  dbService?: DbService
): Appointment {
  return {
    id: dbAppointment.id,
    clientId: dbAppointment.cliente_id,
    serviceId: dbAppointment.servico_id,
    date: dbAppointment.data,
    price: dbAppointment.preco,
    status: dbAppointment.status === 'pendente' ? 'pending' :
            dbAppointment.status === 'confirmado' ? 'confirmed' : 'canceled',
    endTime: dbAppointment.hora_fim,
    cancellationReason: dbAppointment.motivo_cancelamento,
    notes: dbAppointment.observacoes,
    confirmationStatus: dbAppointment.status_confirmacao as any || 'not_confirmed',
    client: dbClient ? {
      id: dbClient.id,
      name: dbClient.nome,
      phone: dbClient.telefone,
      email: dbClient.email,
      notes: dbClient.observacoes,
      birthdate: dbClient.data_nascimento,
      lastAppointment: dbClient.ultimo_agendamento,
      totalSpent: dbClient.valor_total,
      createdAt: dbClient.data_criacao
    } : undefined,
    service: dbService ? {
      id: dbService.id,
      name: dbService.nome,
      description: dbService.descricao,
      price: dbService.preco,
      durationMinutes: dbService.duracao_minutos
    } : undefined
  };
}

export function mapAppAppointmentToDb(
  appointment: Partial<Appointment>
): {
  id?: string;
  cliente_id?: string;
  servico_id?: string;
  data?: string | Date;
  preco?: number;
  status?: string;
  hora_fim?: string | Date | null;
  motivo_cancelamento?: string | null;
  observacoes?: string | null;
  status_confirmacao?: string | null;
} {
  return {
    id: appointment.id,
    cliente_id: appointment.clientId,
    servico_id: appointment.serviceId,
    data: appointment.date,
    preco: appointment.price,
    status: appointment.status === 'pending' ? 'pendente' :
            appointment.status === 'confirmed' ? 'confirmado' : 'cancelado',
    hora_fim: appointment.endTime,
    motivo_cancelamento: appointment.cancellationReason,
    observacoes: appointment.notes,
    status_confirmacao: appointment.confirmationStatus
  };
}

export const mapDbStatusToAppStatus = (dbStatus: Database['public']['Enums']['status_agendamento']): AppointmentStatus => {
  switch (dbStatus) {
    case 'confirmado': return 'confirmed';
    case 'pendente': return 'pending';
    case 'cancelado': return 'canceled';
    default: return 'pending';
  }
};

export const mapAppStatusToDbStatus = (status: AppointmentStatus): Database['public']['Enums']['status_agendamento'] => {
  switch (status) {
    case 'confirmed': return 'confirmado';
    case 'pending': return 'pendente';
    case 'canceled': return 'cancelado';
    default: return 'pendente';
  }
};

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

export const mapDbServiceToApp = (dbService: DbService): Service => {
  return {
    id: dbService.id,
    name: dbService.nome,
    price: Number(dbService.preco),
    durationMinutes: dbService.duracao_minutos,
    description: dbService.descricao || undefined
  };
};

export const mapAppServiceToDb = (service: Partial<Service>): Partial<DbService> => {
  const dbService: Partial<DbService> = {};
  
  if (service.id) dbService.id = service.id;
  if (service.name) dbService.nome = service.name;
  if (service.price !== undefined) dbService.preco = service.price;
  if (service.durationMinutes !== undefined) dbService.duracao_minutos = service.durationMinutes;
  if (service.description) dbService.descricao = service.description;
  
  return dbService;
};

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
