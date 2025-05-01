
import { useCallback } from 'react';
import { useDataContext } from '../useDataContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types';
import { mapAppStatusToDbStatus } from '@/integrations/supabase/mappers/appointmentMapper';

export function useAppointmentOperations() {
  const { appointments, refetchAppointments } = useDataContext();
  const { toast } = useToast();

  // Function to create appointment in Supabase
  const createAppointment = useCallback(async (appointmentData: {
    clienteId: string;
    servicoId: string;
    data: Date;
    horaFim: Date | null;
    preco: number;
    status?: string;
    observacoes?: string;
    motivoCancelamento?: string;
  }) => {
    try {
      // Validate required fields
      if (!appointmentData.clienteId || !appointmentData.servicoId || !appointmentData.data) {
        const errorMsg = 'Cliente, serviço e data são obrigatórios';
        console.error("Missing required appointment fields:", errorMsg);
        return { success: false, error: { message: errorMsg } };
      }
      
      // Map status values properly
      let dbStatus;
      if (appointmentData.status === 'pending') {
        dbStatus = 'pendente';
      } else if (appointmentData.status === 'confirmed') {
        dbStatus = 'confirmado';
      } else if (appointmentData.status === 'canceled') {
        dbStatus = 'cancelado';
      } else {
        dbStatus = appointmentData.status || 'pendente';
      }

      // Calculate end time if not provided
      const horaFim = appointmentData.horaFim || new Date(appointmentData.data.getTime() + 60 * 60 * 1000);

      // Construct the data object to insert
      const dataToInsert = {
        cliente_id: appointmentData.clienteId,
        servico_id: appointmentData.servicoId,
        data_inicio: appointmentData.data.toISOString(),
        data_fim: horaFim.toISOString(),
        preco: appointmentData.preco,
        status: dbStatus,
        observacoes: appointmentData.observacoes || null,
        motivo_cancelamento: appointmentData.motivoCancelamento || null
      };

      console.log("Creating appointment with data:", dataToInsert);

      const { data, error } = await supabase
        .from('agendamentos_novo')
        .insert(dataToInsert)
        .select('*');

      if (error) {
        console.error("Erro ao criar agendamento:", error);
        toast({ 
          title: "Erro", 
          description: "Não foi possível criar o agendamento: " + error.message, 
          variant: "destructive" 
        });
        return { success: false, error };
      }

      console.log("Appointment created successfully:", data);
      
      toast({ 
        title: "Sucesso", 
        description: "Agendamento criado com sucesso!" 
      });
      
      // Immediately refresh the appointments list to update the UI
      await refetchAppointments();
      
      return { success: true, data };
      
    } catch (err: any) {
      console.error("Erro inesperado:", err);
      toast({ 
        title: "Erro", 
        description: "Erro inesperado ao criar agendamento: " + (err.message || "Erro desconhecido"), 
        variant: "destructive" 
      });
      return { success: false, error: err };
    }
  }, [refetchAppointments, toast]);

  // Get appointments for a specific date
  const getAppointmentsForDate = useCallback((date: Date): Appointment[] => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      );
    });
  }, [appointments]);

  // Calculate daily revenue
  const calculateDailyRevenue = useCallback((date: Date): number => {
    return getAppointmentsForDate(date).reduce(
      (total, appointment) => total + appointment.price,
      0
    );
  }, [getAppointmentsForDate]);

  // Function to refresh appointments
  const refreshAppointments = useCallback(async (): Promise<void> => {
    console.log("useAppointmentOperations: refreshAppointments called");
    await refetchAppointments();
  }, [refetchAppointments]);

  return {
    getAppointmentsForDate,
    calculateDailyRevenue,
    refetchAppointments: refreshAppointments,
    createAppointment,
  };
}
