
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

  const fetchBlockedDates = useCallback(async (): Promise<void> => {
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
        const mappedDates: BlockedDate[] = data.map(item => ({
          id: item.id,
          date: new Date(item.data),
          reason: item.motivo || "",
          allDay: item.dia_todo,
          dia_todo: item.dia_todo,
          description: item.descricao || ""
        }));
        setBlockedDates(mappedDates);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar datas bloqueadas';
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

  const addBlockedDate = async (blockedDate: Omit<BlockedDate, "id">): Promise<ServiceResponse<BlockedDate>> => {
    try {
      setLoading(true);
      
      // Make sure required fields are present
      if (!blockedDate.date) {
        throw new Error('Data é obrigatória');
      }
      
      const dateObj = typeof blockedDate.date === 'string' ? new Date(blockedDate.date) : blockedDate.date;
      
      // Create data object for insert
      const dataToInsert = {
        data: dateObj.toISOString(),
        motivo: blockedDate.reason || null,
        descricao: blockedDate.description || null,
        dia_todo: blockedDate.allDay !== undefined ? blockedDate.allDay : true
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
        const newBlockedDate: BlockedDate = {
          id: data.id,
          date: new Date(data.data),
          reason: data.motivo || "",
          allDay: data.dia_todo,
          dia_todo: data.dia_todo,
          description: data.descricao || ""
        };
        
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

  return {
    blockedDates,
    loading,
    error,
    fetchBlockedDates,
    addBlockedDate
  };
}
