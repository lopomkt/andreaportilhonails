
import { BlockedDate } from '@/types';
import { BlockedDateService } from '@/integrations/supabase/blockedDateService';
import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export const useBlockedDateContext = (
  setBlockedDates: React.Dispatch<React.SetStateAction<BlockedDate[]>>,
  blockedDates: BlockedDate[]
) => {
  const fetchBlockedDates = async () => {
    try {
      const blockedDates = await BlockedDateService.getAll();
      setBlockedDates(blockedDates);
      return blockedDates;
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
      return [];
    }
  };

  const addBlockedDate = useCallback(async (blockedDate: Omit<BlockedDate, "id">) => {
    try {
      const dateObj = typeof blockedDate.date === 'string' ? new Date(blockedDate.date) : blockedDate.date;
      
      const created = await BlockedDateService.create({
        date: dateObj.toISOString(),
        reason: blockedDate.reason,
        allDay: blockedDate.allDay || blockedDate.dia_todo
      });
      
      if (created) {
        await fetchBlockedDates(); // Refresh blocked dates after adding a new one
        toast({
          title: 'Data bloqueada',
          description: 'Data bloqueada com sucesso!',
        });
        return { success: true };
      }
      return { success: false, error: "Failed to block date" };
    } catch (error) {
      console.error('Error adding blocked date:', error);
      toast({
        title: 'Erro ao bloquear data',
        description: 'Ocorreu um erro ao bloquear a data. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  }, [fetchBlockedDates]);

  const deleteBlockedDate = useCallback(async (id: string) => {
    try {
      const success = await BlockedDateService.delete(id);
      if (success) {
        await fetchBlockedDates(); // Refresh blocked dates after deletion
        toast({
          title: 'Data desbloqueada',
          description: 'Data desbloqueada com sucesso!',
        });
        return { success: true };
      }
      return { success: false, error: "Failed to unblock date" };
    } catch (error) {
      console.error('Error deleting blocked date:', error);
      toast({
        title: 'Erro ao desbloquear data',
        description: 'Ocorreu um erro ao desbloquear a data. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  }, [fetchBlockedDates]);

  return {
    blockedDates,
    fetchBlockedDates,
    addBlockedDate,
    deleteBlockedDate
  };
};
