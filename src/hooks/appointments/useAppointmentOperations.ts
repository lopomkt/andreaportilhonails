
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
      
      // Validate required fields
      if (!appointment.clientId || !appointment.serviceId || !appointment.date) {
        throw new Error('Cliente, serviço e data são obrigatórios');
      }
      
      const dbAppointmentData = mapAppAppointmentToDb(appointment);
      
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
        return { data, success: true };
      }
      
      return { error: 'Falha ao criar agendamento', success: false };
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      const errorMessage = err?.message || 'Erro ao criar agendamento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    }
  }, [setAppointments, toast]);

  const createAppointment = useCallback(async (appointment: any) => {
    try {
      console.log("Creating appointment with data:", appointment);
      
      // Validate required fields
      if (!appointment.clienteId || !appointment.servicoId || !appointment.data) {
        throw new Error('Cliente, serviço e data são obrigatórios');
      }
      
      // Ensure date is in ISO format
      const formattedData = {
        cliente_id: appointment.clienteId,
        servico_id: appointment.servicoId,
        data: appointment.data instanceof Date ? appointment.data.toISOString() : appointment.data,
        hora_fim: appointment.horaFim instanceof Date ? appointment.horaFim.toISOString() : appointment.horaFim,
        preco: appointment.preco || 0,
        status: appointment.status || 'confirmado',
        motivo_cancelamento: appointment.motivoCancelamento || null,
        observacoes: appointment.observacoes || null,
        status_confirmacao: appointment.statusConfirmacao || 'not_confirmed'
      };
      
      console.log("Formatted appointment data for Supabase:", formattedData);
      
      const { data, error } = await supabase
        .from('agendamentos')
        .insert(formattedData)
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .single();
        
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      if (data) {
        console.log("Appointment created successfully:", data);
        setAppointments(prev => [...prev, data as unknown as Appointment]);
        
        return { success: true, data };
      }
      
      return { success: false, error: 'Falha ao criar agendamento' };
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      const errorMessage = err?.message || 'Erro ao criar agendamento';
      return { success: false, error: err };
    }
  }, [setAppointments]);

  const updateAppointment = useCallback(async (id: string, appointmentData: Partial<Appointment>) => {
    try {
      console.log("Updating appointment:", id, appointmentData);
      
      // Validate required fields for updates
      if (appointmentData.date) {
        appointmentData.date = appointmentData.date instanceof Date 
          ? appointmentData.date.toISOString() 
          : appointmentData.date;
      }
      
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
        
        return { success: true, data };
      }
      
      return { success: false, error: 'Falha ao atualizar agendamento' };
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      const errorMessage = err?.message || 'Erro ao atualizar agendamento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { success: false, error: errorMessage };
    }
  }, [setAppointments, toast]);

  return {
    addAppointment,
    updateAppointment,
    createAppointment
  };
}
