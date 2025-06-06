
import { BlockedDate } from '@/types';
import { BlockedDateService } from '@/integrations/supabase/blockedDateService';
import { useCallback } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { normalizeDateNoon } from '@/lib/dateUtils';

export const useBlockedDateContext = (
  setBlockedDates: React.Dispatch<React.SetStateAction<BlockedDate[]>>,
  blockedDates: BlockedDate[]
) => {
  const { handleError, handleSuccess } = useErrorHandler();

  const fetchBlockedDates = async (): Promise<void> => {
    try {
      const blockedDates = await BlockedDateService.getAll();
      setBlockedDates(blockedDates);
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
      handleError(error, "Erro ao buscar datas bloqueadas");
    }
  };

  const addBlockedDate = useCallback(async (blockedDate: Omit<BlockedDate, "id">) => {
    try {
      const dateObj = typeof blockedDate.date === 'string' 
        ? new Date(blockedDate.date) 
        : blockedDate.date;
      
      const normalizedDate = normalizeDateNoon(dateObj);
      
      const created = await BlockedDateService.create({
        date: normalizedDate.toISOString(),
        reason: blockedDate.reason,
        allDay: blockedDate.allDay || false
      });
      
      if (created) {
        await fetchBlockedDates();
        handleSuccess('Data bloqueada', 'Data bloqueada com sucesso!');
        return { success: true };
      }
      return { success: false, error: "Failed to block date" };
    } catch (error) {
      console.error('Error adding blocked date:', error);
      handleError(error, 'Erro ao bloquear data');
      return { success: false, error };
    }
  }, [fetchBlockedDates, handleError, handleSuccess]);

  const deleteBlockedDate = useCallback(async (id: string) => {
    try {
      const success = await BlockedDateService.delete(id);
      if (success) {
        await fetchBlockedDates();
        handleSuccess('Data desbloqueada', 'Data desbloqueada com sucesso!');
        return { success: true };
      }
      return { success: false, error: "Failed to unblock date" };
    } catch (error) {
      console.error('Error deleting blocked date:', error);
      handleError(error, 'Erro ao desbloquear data');
      return { success: false, error };
    }
  }, [fetchBlockedDates, handleError, handleSuccess]);

  return {
    blockedDates,
    fetchBlockedDates,
    addBlockedDate,
    deleteBlockedDate
  };
};
