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

export function mapAppClientToDb(client: Client, userId?: string): Omit<DbClient, 'id'> & { id?: string; user_id?: string } {
  return {
    id: client.id || undefined,
    nome: client.name,
    telefone: client.phone,
    email: client.email || null,
    data_nascimento: client.birthdate || null,
    observacoes: client.notes || null,
    ultimo_agendamento: client.lastAppointment || null,
    data_ultimo_agendamento: client.lastAppointment || null,
    valor_total: client.totalSpent || 0,
    data_criacao: client.createdAt || new Date().toISOString(),
    user_id: userId || undefined,
  };
}
