
import { useCallback } from 'react';
import { Appointment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapAppAppointmentToDb } from '@/integrations/supabase/mappers';
import { useToast } from '@/hooks/use-toast';

export function useAppointmentOperations(setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>) {
  const { toast } = useToast();

  const addAppointment = useCallback(async (appointment: Omit<Appointment, "id">) => {
    try {
      console.log("Creating appointment:", appointment);
      const dbAppointmentData = mapAppAppointmentToDb(appointment);
      
      if (!dbAppointmentData.cliente_id || !dbAppointmentData.servico_id || !dbAppointmentData.data) {
        throw new Error('Cliente, serviço e data são obrigatórios');
      }
      
      const { data, error } = await supabase
        .from('agendamentos')
        .insert(dbAppointmentData as any)
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setAppointments(prev => [...prev, data as unknown as Appointment]);
        toast({
          title: 'Agendamento criado',
          description: 'Agendamento cadastrado com sucesso'
        });
        return { data };
      }
      
      return { error: 'Falha ao criar agendamento' };
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      const errorMessage = err?.message || 'Erro ao criar agendamento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage };
    }
  }, [setAppointments, toast]);

  const updateAppointment = useCallback(async (id: string, appointmentData: Partial<Appointment>) => {
    try {
      console.log("Updating appointment:", id, appointmentData);
      const dbAppointmentData = mapAppAppointmentToDb(appointmentData);
      
      const { data, error } = await supabase
        .from('agendamentos')
        .update(dbAppointmentData)
        .eq('id', id)
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setAppointments(prev => 
          prev.map(appointment => 
            appointment.id === id ? { ...appointment, ...appointmentData } : appointment
          )
        );
        
        toast({
          title: 'Agendamento atualizado',
          description: 'Agendamento atualizado com sucesso'
        });
        
        return { data };
      }
      
      return { error: 'Falha ao atualizar agendamento' };
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      const errorMessage = err?.message || 'Erro ao atualizar agendamento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage };
    }
  }, [setAppointments, toast]);

  return {
    addAppointment,
    updateAppointment
  };
}
