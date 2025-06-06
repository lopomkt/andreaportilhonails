
import { DbBlockedDate } from '../database-types';
import { BlockedDate } from '@/types';

export function mapDbBlockedDateToApp(dbBlockedDate: DbBlockedDate): BlockedDate {
  return {
    id: dbBlockedDate.id,
    date: dbBlockedDate.data,
    reason: dbBlockedDate.motivo || undefined,
    description: dbBlockedDate.descricao || undefined,
    allDay: dbBlockedDate.dia_todo,
  };
}

export function mapAppBlockedDateToDb(blockedDate: Partial<BlockedDate>): Partial<DbBlockedDate> {
  const dbBlockedDate: Partial<DbBlockedDate> = {};
  
  if (blockedDate.id !== undefined) dbBlockedDate.id = blockedDate.id;
  if (blockedDate.date !== undefined) {
    const dateValue = blockedDate.date;
    if (typeof dateValue === 'string') {
      dbBlockedDate.data = dateValue;
    } else if (dateValue && typeof dateValue === 'object' && 'toISOString' in dateValue) {
      dbBlockedDate.data = (dateValue as Date).toISOString();
    } else {
      dbBlockedDate.data = String(dateValue);
    }
  }
  if (blockedDate.reason !== undefined) dbBlockedDate.motivo = blockedDate.reason;
  if (blockedDate.description !== undefined) dbBlockedDate.descricao = blockedDate.description;
  if (blockedDate.allDay !== undefined) dbBlockedDate.dia_todo = blockedDate.allDay;
  
  return dbBlockedDate;
}
