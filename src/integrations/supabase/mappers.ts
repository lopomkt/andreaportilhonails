
import { DbClient, DbAppointment, DbService, DbBlockedDate } from './database-types';
import { 
  Client, 
  Appointment, 
  Service, 
  BlockedDate, 
  AppointmentStatus 
} from '@/types';

/**
 * Maps a client from the database format to the application format
 */
export function mapDbClientToApp(dbClient: DbClient): Client {
  return {
    id: dbClient.id,
    name: dbClient.nome,
    phone: dbClient.telefone,
    email: dbClient.email || undefined,
    birthdate: dbClient.data_nascimento || undefined,
    notes: dbClient.observacoes || undefined,
    lastAppointment: dbClient.ultimo_agendamento || undefined,
    totalSpent: dbClient.valor_total || 0,
    createdAt: dbClient.data_criacao,
  };
}

/**
 * Maps a client from the application format to the database format
 */
export function mapAppClientToDb(client: Client): DbClient {
  return {
    id: client.id,
    nome: client.name,
    telefone: client.phone,
    email: client.email || null,
    data_nascimento: client.birthdate || null,
    observacoes: client.notes || null,
    ultimo_agendamento: client.lastAppointment || null,
    data_ultimo_agendamento: client.lastAppointment || null,
    valor_total: client.totalSpent || 0,
    data_criacao: client.createdAt || new Date().toISOString(),
  };
}

/**
 * Maps an appointment from the database format to the application format
 */
export function mapDbAppointmentToApp(
  dbAppointment: DbAppointment, 
  dbClient?: DbClient, 
  dbService?: DbService
): Appointment {
  let client: Client | undefined = undefined;
  if (dbClient) {
    client = mapDbClientToApp(dbClient);
  }

  let service: Service | undefined = undefined;
  if (dbService) {
    service = mapDbServiceToApp(dbService);
  }

  // Map the status from DB to app format
  let status: AppointmentStatus = 'pending';
  if (dbAppointment.status === 'confirmado') {
    status = 'confirmed';
  } else if (dbAppointment.status === 'cancelado') {
    status = 'canceled';
  }

  return {
    id: dbAppointment.id,
    clientId: dbAppointment.cliente_id,
    serviceId: dbAppointment.servico_id,
    date: dbAppointment.data,
    endTime: dbAppointment.hora_fim || undefined,
    price: dbAppointment.preco || 0,
    status: status,
    cancellationReason: dbAppointment.motivo_cancelamento || undefined,
    notes: dbAppointment.observacoes || undefined,
    confirmationStatus: dbAppointment.status_confirmacao || 'not_confirmed',
    client,
    service
  };
}

/**
 * Maps an appointment from the application format to the database format
 */
export function mapAppAppointmentToDb(appointment: Partial<Appointment>): Partial<DbAppointment> {
  const dbAppointment: Partial<DbAppointment> = {};
  
  if (appointment.clientId !== undefined) dbAppointment.cliente_id = appointment.clientId;
  if (appointment.serviceId !== undefined) dbAppointment.servico_id = appointment.serviceId;
  if (appointment.date !== undefined) {
    // Convert Date objects to ISO strings
    dbAppointment.data = typeof appointment.date === 'string'
      ? appointment.date
      : appointment.date.toISOString();
  }
  if (appointment.endTime !== undefined) {
    // Convert Date objects to ISO strings
    dbAppointment.hora_fim = typeof appointment.endTime === 'string'
      ? appointment.endTime
      : appointment.endTime.toISOString();
  }
  if (appointment.price !== undefined) dbAppointment.preco = appointment.price;
  if (appointment.status !== undefined) dbAppointment.status = mapAppStatusToDbStatus(appointment.status);
  if (appointment.cancellationReason !== undefined) dbAppointment.motivo_cancelamento = appointment.cancellationReason;
  if (appointment.notes !== undefined) dbAppointment.observacoes = appointment.notes;
  if (appointment.confirmationStatus !== undefined) dbAppointment.status_confirmacao = appointment.confirmationStatus;

  return dbAppointment;
}

/**
 * Maps a service from the database format to the application format
 */
export function mapDbServiceToApp(dbService: DbService): Service {
  return {
    id: dbService.id,
    name: dbService.nome,
    price: dbService.preco || 0,
    durationMinutes: dbService.duracao_minutos || 60,
    description: dbService.descricao || undefined
  };
}

/**
 * Maps a service from the application format to the database format
 */
export function mapAppServiceToDb(service: Partial<Service>): Partial<DbService> {
  const dbService: Partial<DbService> = {};
  
  if (service.id !== undefined) dbService.id = service.id;
  if (service.name !== undefined) dbService.nome = service.name;
  if (service.price !== undefined) dbService.preco = service.price;
  if (service.durationMinutes !== undefined) dbService.duracao_minutos = service.durationMinutes;
  if (service.description !== undefined) dbService.descricao = service.description;
  
  return dbService;
}

/**
 * Maps a blocked date from the database format to the application format
 */
export function mapDbBlockedDateToApp(dbBlockedDate: DbBlockedDate): BlockedDate {
  return {
    id: dbBlockedDate.id,
    date: dbBlockedDate.data,
    reason: dbBlockedDate.motivo || undefined,
    motivo: dbBlockedDate.motivo || undefined,
    description: dbBlockedDate.descricao || undefined,
    allDay: dbBlockedDate.dia_todo,
    dia_todo: dbBlockedDate.dia_todo
  };
}

/**
 * Maps a blocked date from the application format to the database format
 */
export function mapAppBlockedDateToDb(blockedDate: Partial<BlockedDate>): Partial<DbBlockedDate> {
  const dbBlockedDate: Partial<DbBlockedDate> = {};
  
  if (blockedDate.id !== undefined) dbBlockedDate.id = blockedDate.id;
  if (blockedDate.date !== undefined) {
    // Convert Date objects to ISO strings
    dbBlockedDate.data = typeof blockedDate.date === 'string'
      ? blockedDate.date
      : blockedDate.date.toISOString();
  }
  if (blockedDate.reason !== undefined) dbBlockedDate.motivo = blockedDate.reason;
  if (blockedDate.motivo !== undefined) dbBlockedDate.motivo = blockedDate.motivo;
  if (blockedDate.description !== undefined) dbBlockedDate.descricao = blockedDate.description;
  if (blockedDate.allDay !== undefined) dbBlockedDate.dia_todo = blockedDate.allDay;
  if (blockedDate.dia_todo !== undefined) dbBlockedDate.dia_todo = blockedDate.dia_todo;
  
  return dbBlockedDate;
}

/**
 * Maps appointment status from application format to database format
 */
export function mapAppStatusToDbStatus(status: AppointmentStatus): string {
  switch (status) {
    case 'confirmed': return 'confirmado';
    case 'canceled': return 'cancelado';
    case 'pending':
    default:
      return 'pendente';
  }
}
