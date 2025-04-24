
import { DbService } from '../database-types';
import { Service } from '@/types';

export function mapDbServiceToApp(dbService: DbService): Service {
  return {
    id: dbService.id,
    name: dbService.nome,
    price: dbService.preco || 0,
    durationMinutes: dbService.duracao_minutos || 60,
    description: dbService.descricao || undefined
  };
}

export function mapAppServiceToDb(service: Partial<Service>): Partial<DbService> {
  const dbService: Partial<DbService> = {};
  
  if (service.id !== undefined) dbService.id = service.id;
  if (service.name !== undefined) dbService.nome = service.name;
  if (service.price !== undefined) dbService.preco = service.price;
  if (service.durationMinutes !== undefined) dbService.duracao_minutos = service.durationMinutes;
  if (service.description !== undefined) dbService.descricao = service.description;
  
  return dbService;
}
