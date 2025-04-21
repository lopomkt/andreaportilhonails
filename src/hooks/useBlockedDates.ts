
import { useState, useCallback } from 'react';
import { BlockedDate, ServiceResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapDbBlockedDateToApp, mapAppBlockedDateToDb } from '@/integrations/supabase/mappers';
import { useToast } from '@/hooks/use-toast';

export function useBlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBlockedDates = useCallback(async (): Promise<BlockedDate[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('datas_bloqueadas')
        .select('*')
        .order('data', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const mappedDates: BlockedDate[] = data.map(item => mapDbBlockedDateToApp(item));
        setBlockedDates(mappedDates);
        return mappedDates;
      }
      
      return [];
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar datas bloqueadas';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addBlockedDate = async (blockedDate: Omit<BlockedDate, "id">): Promise<ServiceResponse<BlockedDate>> => {
    try {
      setLoading(true);
      
      // Make sure required fields are present
      if (!blockedDate.date) {
        throw new Error('Data é obrigatória');
      }
      
      // Convert app model to database model
      const dbBlockedDateData = mapAppBlockedDateToDb(blockedDate);
      
      // Create data object with required fields only for insert
      // Ensure 'data' field is properly set as it's required
      const dataToInsert = {
        data: dbBlockedDateData.data,
        motivo: dbBlockedDateData.motivo || null,
        descricao: dbBlockedDateData.descricao || null,
        valor: dbBlockedDateData.valor || null,
        dia_todo: dbBlockedDateData.dia_todo !== undefined ? dbBlockedDateData.dia_todo : true
      };
      
      const { data, error } = await supabase
        .from('datas_bloqueadas')
        .insert(dataToInsert)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const newBlockedDate = mapDbBlockedDateToApp(data);
        setBlockedDates(prev => [...prev, newBlockedDate]);
        
        toast({
          title: 'Data bloqueada',
          description: 'Data bloqueada com sucesso'
        });
        
        return { data: newBlockedDate };
      }
      
      return { error: 'Falha ao bloquear data' };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao bloquear data';
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
  };

  const deleteBlockedDate = async (id: string): Promise<ServiceResponse<boolean>> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('datas_bloqueadas')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setBlockedDates(prev => prev.filter(date => date.id !== id));
      
      toast({
        title: 'Bloqueio removido',
        description: 'Data desbloqueada com sucesso'
      });
      
      return { data: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao desbloquear data';
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
  };

  return {
    blockedDates,
    loading,
    error,
    fetchBlockedDates,
    addBlockedDate,
    deleteBlockedDate
  };
}
