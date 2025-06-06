
import { useState, useCallback } from 'react';
import { BlockedDate } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BlockedDateService } from '@/integrations/supabase/blockedDateService';

export function useBlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBlockedDates = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const blockedDatesData = await BlockedDateService.getAll();
      
      // Ensure dates are stored as strings to match the BlockedDate type
      const formattedBlockedDates: BlockedDate[] = blockedDatesData.map(item => ({
        id: item.id,
        date: typeof item.date === 'string' ? item.date : (item.date as Date).toISOString(),
        reason: item.reason || '',
        motivo: item.reason || '',
        description: item.description || '', 
        allDay: item.allDay || false,
      }));
      
      setBlockedDates(formattedBlockedDates);
      setError(null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar datas bloqueadas';
      console.error("Error fetching blocked dates:", errorMessage);
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addBlockedDate = useCallback(async (blockedDate: Omit<BlockedDate, 'id'>): Promise<any> => {
    try {
      setLoading(true);
      
      // Convert Date object to ISO string if needed
      const dateValue = typeof blockedDate.date === 'object' 
        ? (blockedDate.date as Date).toISOString() 
        : blockedDate.date;
      
      const success = await BlockedDateService.create({
        date: dateValue,
        reason: blockedDate.reason,
        allDay: blockedDate.allDay || false
      });
      
      if (success) {
        // After successful creation, refresh the blocked dates
        await fetchBlockedDates();
        
        toast({
          title: 'Data bloqueada',
          description: 'A data foi bloqueada com sucesso'
        });
        
        return { success: true };
      }
      
      throw new Error('Falha ao bloquear a data');
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao bloquear data';
      console.error("Error adding blocked date:", errorMessage);
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchBlockedDates, toast]);

  return {
    blockedDates,
    loading,
    error,
    fetchBlockedDates,
    addBlockedDate
  };
}
