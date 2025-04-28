
import { DbClient } from '../database-types';
import { Client } from '@/types';

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

export function mapAppClientToDb(client: Client): DbClient {
  // Convert Date objects to ISO strings for database
  const birthdate = client.birthdate 
    ? (client.birthdate instanceof Date ? client.birthdate.toISOString() : client.birthdate) 
    : null;
    
  const lastAppointment = client.lastAppointment 
    ? (client.lastAppointment instanceof Date ? client.lastAppointment.toISOString() : client.lastAppointment)
    : null;
    
  const createdAt = client.createdAt
    ? (client.createdAt instanceof Date ? client.createdAt.toISOString() : client.createdAt)
    : new Date().toISOString();

  return {
    id: client.id,
    nome: client.name,
    telefone: client.phone,
    email: client.email || null,
    data_nascimento: birthdate,
    observacoes: client.notes || null,
    ultimo_agendamento: lastAppointment,
    data_ultimo_agendamento: lastAppointment,
    valor_total: client.totalSpent || 0,
    data_criacao: createdAt,
  };
}
