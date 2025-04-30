
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
        .from('agendamentos_novo')
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
      console.log("Enviando agendamento:", appointment);
      
      // Validate required fields
      if (!appointment.clienteId || !appointment.servicoId || !appointment.data) {
        const errorMsg = 'Cliente, serviço e data são obrigatórios';
        console.error("Missing required appointment fields:", errorMsg);
        return { success: false, error: { message: errorMsg } };
      }
      
      // Prepare data for new appointments table format
      const formattedData = {
        cliente_id: appointment.clienteId,
        servico_id: appointment.servicoId,
        data_inicio: appointment.data instanceof Date ? appointment.data.toISOString() : appointment.data,
        data_fim: appointment.horaFim instanceof Date ? appointment.horaFim.toISOString() : appointment.horaFim,
        preco: appointment.preco || 0,
        status: appointment.status || 'pendente',
        observacoes: appointment.observacoes || null
      };
      
      console.log("Formatted appointment data for Supabase:", formattedData);
      
      // Insert into the new table structure
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .insert(formattedData)
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .single();
      
      console.log("Resposta do Supabase:", { data, error });
        
      if (error) {
        console.error("Supabase error:", error);
        return { success: false, error: { message: error.message || 'Erro ao criar agendamento' } };
      }
      
      if (data) {
        console.log("Appointment created successfully:", data);
        setAppointments(prev => [...prev, data as unknown as Appointment]);
        
        return { success: true, data };
      }
      
      return { success: false, error: { message: 'Falha ao criar agendamento' } };
    } catch (err: any) {
      console.error("Erro inesperado em addAppointment:", err);
      return { success: false, error: { message: err?.message || 'Erro inesperado ao agendar' } };
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
        .from('agendamentos_novo')
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
      
      return { success: false, error: { message: 'Falha ao atualizar agendamento' } };
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      const errorMessage = err?.message || 'Erro ao atualizar agendamento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { success: false, error: { message: errorMessage } };
    }
  }, [setAppointments, toast]);

  return {
    addAppointment,
    updateAppointment,
    createAppointment
  };
}
