import React, { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, AppointmentStatus } from '@/types';
import { mapDbAppointmentToApp, mapAppStatusToDbStatus } from '@/integrations/supabase/mappers/appointmentMapper';
import { useToast } from '@/hooks/use-toast';

export function useAppointmentService() {
  const { toast } = useToast();

  const fetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    try {
      console.log("useAppointmentService: Fetching appointments...");
      
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .select(`
          *,
          cliente:clientes(*),
          servico:servicos(*)
        `)
        .order('data_inicio', { ascending: true });

      if (error) {
        console.error("useAppointmentService: Error fetching appointments:", error);
        throw new Error(error.message);
      }

      if (!data) {
        console.log("useAppointmentService: No data returned");
        return [];
      }

      const appointments = data.map(dbAppointment => 
        mapDbAppointmentToApp(dbAppointment, dbAppointment.cliente, dbAppointment.servico)
      );

      console.log("useAppointmentService: Successfully fetched", appointments.length, "appointments");
      return appointments;
    } catch (error: any) {
      console.error("useAppointmentService: fetchAppointments error:", error);
      toast({
        title: "Erro ao carregar agendamentos",
        description: "Não foi possível carregar os agendamentos. Tente novamente.",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const createAppointment = useCallback(async (appointmentData: {
    clienteId: string;
    servicoId: string;
    data: Date;
    horaFim?: Date | null;
    preco: number;
    status?: string;
    observacoes?: string;
    motivoCancelamento?: string;
  }) => {
    try {
      console.log("useAppointmentService: Creating appointment:", appointmentData);

      // Validate required fields
      if (!appointmentData.clienteId || !appointmentData.servicoId || !appointmentData.data) {
        const errorMsg = 'Cliente, serviço e data são obrigatórios';
        console.error("useAppointmentService: Missing required fields:", errorMsg);
        return { success: false, error: errorMsg };
      }
      
      // Calculate end time if not provided
      const endTime = appointmentData.horaFim || new Date(appointmentData.data.getTime() + 60 * 60 * 1000);

      // Prepare data for database
      const dbData = {
        cliente_id: appointmentData.clienteId,
        servico_id: appointmentData.servicoId,
        data_inicio: appointmentData.data.toISOString(),
        data_fim: endTime.toISOString(),
        preco: appointmentData.preco,
        status: appointmentData.status === 'confirmed' ? 'confirmado' : 
                appointmentData.status === 'canceled' ? 'cancelado' : 'pendente',
        observacoes: appointmentData.observacoes || null,
        motivo_cancelamento: appointmentData.motivoCancelamento || null
      };

      const { data, error } = await supabase
        .from('agendamentos_novo')
        .insert(dbData)
        .select('*');

      if (error) {
        console.error("useAppointmentService: Error creating appointment:", error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o agendamento: " + error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      console.log("useAppointmentService: Appointment created successfully:", data);
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!"
      });
      
      return { success: true, data };
    } catch (error: any) {
      console.error("useAppointmentService: createAppointment error:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar agendamento: " + (error.message || "Erro desconhecido"),
        variant: "destructive"
      });
      return { success: false, error };
    }
  }, [toast]);

  const updateAppointment = useCallback(async (id: string, updateData: Partial<Appointment>) => {
    try {
      console.log("useAppointmentService: Updating appointment:", id, updateData);

      // Map app fields to database fields
      const dbData: Record<string, any> = {};
      
      if (updateData.clientId) dbData.cliente_id = updateData.clientId;
      if (updateData.serviceId) dbData.servico_id = updateData.serviceId;
      if (updateData.date) {
        dbData.data_inicio = typeof updateData.date === 'string' 
          ? updateData.date 
          : new Date(updateData.date).toISOString();
      }
      if (updateData.endTime) {
        dbData.data_fim = typeof updateData.endTime === 'string' 
          ? updateData.endTime 
          : new Date(updateData.endTime).toISOString();
      }
      if (updateData.price !== undefined) dbData.preco = updateData.price;
      if (updateData.status) dbData.status = mapAppStatusToDbStatus(updateData.status);
      if (updateData.notes !== undefined) dbData.observacoes = updateData.notes;
      if (updateData.cancellationReason !== undefined) dbData.motivo_cancelamento = updateData.cancellationReason;

      const { error } = await supabase
        .from('agendamentos_novo')
        .update(dbData)
        .eq('id', id);

      if (error) {
        console.error("useAppointmentService: Error updating appointment:", error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o agendamento: " + error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      console.log("useAppointmentService: Appointment updated successfully");
      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso!"
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("useAppointmentService: updateAppointment error:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar agendamento: " + (error.message || "Erro desconhecido"),
        variant: "destructive"
      });
      return { success: false, error };
    }
  }, [toast]);

  const deleteAppointment = useCallback(async (id: string) => {
    try {
      console.log("useAppointmentService: Deleting appointment:", id);

      const { error } = await supabase
        .from('agendamentos_novo')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("useAppointmentService: Error deleting appointment:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o agendamento: " + error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }

      console.log("useAppointmentService: Appointment deleted successfully");
      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!"
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("useAppointmentService: deleteAppointment error:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir agendamento: " + (error.message || "Erro desconhecido"),
        variant: "destructive"
      });
      return { success: false, error };
    }
  }, [toast]);

  return {
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment
  };
}