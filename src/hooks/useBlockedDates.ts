
import { useState, useCallback } from 'react';
import { BlockedDate } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BlockedDateService } from '@/integrations/supabase/blockedDateService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { normalizeDateNoon, safeDateParse } from '@/lib/dateUtils';

export function useBlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler();

  const fetchBlockedDates = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const blockedDatesData = await BlockedDateService.getAll();
      
      // Ensure dates are stored as strings with proper normalization
      const formattedBlockedDates: BlockedDate[] = blockedDatesData.map(item => {
        const parsedDate = safeDateParse(item.date);
        return {
          id: item.id,
          date: parsedDate ? parsedDate.toISOString() : (typeof item.date === 'string' ? item.date : new Date(item.date).toISOString()),
          reason: item.reason || '',
          description: item.description || '', 
          allDay: item.allDay || false,
        };
      });
      
      setBlockedDates(formattedBlockedDates);
      setError(null);
    } catch (err: any) {
      handleError(err, 'Erro ao buscar datas bloqueadas');
      setError(err?.message || 'Erro ao buscar datas bloqueadas');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const addBlockedDate = useCallback(async (blockedDate: Omit<BlockedDate, 'id'>): Promise<any> => {
    try {
      setLoading(true);
      
      // Convert Date object to ISO string with proper normalization
      const dateValue = typeof blockedDate.date === 'object' 
        ? normalizeDateNoon(blockedDate.date as Date).toISOString()
        : blockedDate.date;
      
      const success = await BlockedDateService.create({
        date: dateValue,
        reason: blockedDate.reason,
        allDay: blockedDate.allDay || false
      });
      
      if (success) {
        await fetchBlockedDates();
        handleSuccess('Data bloqueada', 'A data foi bloqueada com sucesso');
        return { success: true };
      }
      
      throw new Error('Falha ao bloquear a data');
    } catch (err: any) {
      handleError(err, 'Erro ao bloquear data');
      return { error: err?.message || 'Erro ao bloquear data' };
    } finally {
      setLoading(false);
    }
  }, [fetchBlockedDates, handleError, handleSuccess]);

  return {
    blockedDates,
    loading,
    error,
    fetchBlockedDates,
    addBlockedDate
  };
}
