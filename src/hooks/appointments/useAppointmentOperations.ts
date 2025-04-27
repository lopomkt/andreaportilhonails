
import { useCallback } from 'react';
import { Appointment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapAppAppointmentToDb } from '@/integrations/supabase/mappers';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/DataContext';

export function useAppointmentOperations() {
  const { toast } = useToast();
  const { refetchAppointments } = useData();

  const addAppointment = useCallback(async (appointment: Omit<Appointment, "id">) => {
    try {
      const dbAppointmentData = mapAppAppointmentToDb(appointment);
      
      if (!dbAppointmentData.cliente_id || !dbAppointmentData.servico_id || !dbAppointmentData.data) {
        throw new Error('Cliente, serviço e data são obrigatórios');
      }
      
      const { data, error } = await supabase
        .from('agendamentos')
        .insert(dbAppointmentData as any)
        .select('*')
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Refresh appointments data after adding a new one
        await refetchAppointments();
        
        toast({
          title: 'Agendamento criado',
          description: 'Agendamento cadastrado com sucesso'
        });
        return { data };
      }
      
      return { error: 'Falha ao criar agendamento' };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao criar agendamento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage };
    }
  }, [toast, refetchAppointments]);

  const updateAppointment = useCallback(async (id: string, appointmentData: Partial<Appointment>) => {
    try {
      const dbAppointmentData = mapAppAppointmentToDb(appointmentData);
      
      const { data, error } = await supabase
        .from('agendamentos')
        .update(dbAppointmentData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Refresh appointments data after updating
        await refetchAppointments();
        
        toast({
          title: 'Agendamento atualizado',
          description: 'Agendamento atualizado com sucesso'
        });
        
        return { data };
      }
      
      return { error: 'Falha ao atualizar agendamento' };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao atualizar agendamento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage };
    }
  }, [toast, refetchAppointments]);

  return {
    addAppointment,
    updateAppointment
  };
}
