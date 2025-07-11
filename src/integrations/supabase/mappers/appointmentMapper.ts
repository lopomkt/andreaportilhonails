
import { DbAppointment, DbClient, DbService } from '../database-types';
import { Appointment, AppointmentStatus, ConfirmationStatus } from '@/types';
import { mapDbClientToApp } from './clientMapper';
import { mapDbServiceToApp } from './serviceMapper';

export function mapDbAppointmentToApp(
  dbAppointment: DbAppointment, 
  dbClient?: DbClient | null, 
  dbService?: DbService | null
): Appointment {
  // Safely handle client/service data that might be error objects from Supabase
  let client = dbClient && !('error' in dbClient) ? mapDbClientToApp(dbClient) : undefined;
  let service = dbService && !('error' in dbService) ? mapDbServiceToApp(dbService) : undefined;

  let status: AppointmentStatus = 'pending';
  if (dbAppointment.status === 'confirmado') {
    status = 'confirmed';
  } else if (dbAppointment.status === 'cancelado') {
    status = 'canceled';
  }

  // confirmationStatus não existe na tabela, usar status padrão
  let confirmationStatus: ConfirmationStatus = 'not_confirmed';
  if (status === 'confirmed') {
    confirmationStatus = 'confirmed';
  } else if (status === 'canceled') {
    confirmationStatus = 'canceled';
  }

  return {
    id: dbAppointment.id,
    clientId: dbAppointment.cliente_id,
    serviceId: dbAppointment.servico_id,
    date: dbAppointment.data_inicio,
    endTime: dbAppointment.data_fim || undefined,
    price: dbAppointment.preco || 0,
    status,
    cancellationReason: dbAppointment.motivo_cancelamento || undefined,
    notes: dbAppointment.observacoes || undefined,
    confirmationStatus,
    client,
    service
  };
}

export function mapAppAppointmentToDb(appointment: Partial<Appointment>): Partial<DbAppointment> {
  const dbAppointment: Partial<DbAppointment> = {};
  
  if (appointment.clientId !== undefined) dbAppointment.cliente_id = appointment.clientId;
  if (appointment.serviceId !== undefined) dbAppointment.servico_id = appointment.serviceId;
  if (appointment.date !== undefined) {
    dbAppointment.data_inicio = typeof appointment.date === 'string' 
      ? appointment.date 
      : appointment.date instanceof Date 
        ? appointment.date.toISOString() 
        : String(appointment.date);
  }
  if (appointment.endTime !== undefined) {
    dbAppointment.data_fim = typeof appointment.endTime === 'string' 
      ? appointment.endTime 
      : appointment.endTime instanceof Date 
        ? appointment.endTime.toISOString() 
        : String(appointment.endTime);
  }
  if (appointment.price !== undefined) dbAppointment.preco = appointment.price;
  if (appointment.status !== undefined) dbAppointment.status = mapAppStatusToDbStatus(appointment.status);
  if (appointment.cancellationReason !== undefined) dbAppointment.motivo_cancelamento = appointment.cancellationReason;
  if (appointment.notes !== undefined) dbAppointment.observacoes = appointment.notes;
  // status_confirmacao não existe na tabela atual

  return dbAppointment;
}

export function mapAppStatusToDbStatus(status: AppointmentStatus): "confirmado" | "pendente" | "cancelado" {
  switch (status) {
    case 'confirmed': return 'confirmado';
    case 'canceled': return 'cancelado';
    case 'pending':
    default:
      return 'pendente';
  }
}
