import { useCallback } from 'react';
import { useDataContext } from '../useDataContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types';
import { mapAppStatusToDbStatus } from '@/integrations/supabase/mappers/appointmentMapper';

export function useAppointmentOperations() {
  const { appointments, refetchAppointments } = useDataContext();
  const { toast } = useToast();

  // Function to delete appointment in Supabase
  const deleteAppointment = useCallback(async (id: string) => {
    try {
      console.log("useAppointmentOperations: Deleting appointment with ID:", id);
      
      const { error } = await supabase
        .from('agendamentos_novo')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("useAppointmentOperations: Error deleting appointment:", error);
        toast({ 
          title: "Erro", 
          description: "Não foi possível excluir o agendamento: " + error.message, 
          variant: "destructive" 
        });
        return false;
      }

      console.log("useAppointmentOperations: Delete successful, refreshing appointments...");
      toast({ 
        title: "Sucesso", 
        description: "Agendamento excluído com sucesso!" 
      });
      
      // Refresh the appointments list
      await refetchAppointments();
      console.log("useAppointmentOperations: Appointments refreshed after delete");
      
      return true;
    } catch (err: any) {
      console.error("useAppointmentOperations: Unexpected error deleting appointment:", err);
      toast({ 
        title: "Erro", 
        description: "Erro inesperado ao excluir agendamento: " + (err.message || "Erro desconhecido"), 
        variant: "destructive" 
      });
      return false;
    }
  }, [refetchAppointments, toast]);

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

  // Function to update appointment in Supabase
  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>) => {
    try {
      console.log("useAppointmentOperations: Updating appointment:", id, data);
      
      // Map status from app to database format
      let dbData: Record<string, any> = { ...data };
      
      if (data.status) {
        let dbStatus;
        if (data.status === 'pending') {
          dbStatus = 'pendente';
        } else if (data.status === 'confirmed') {
          dbStatus = 'confirmado';
        } else if (data.status === 'canceled') {
          dbStatus = 'cancelado';
        }
        
        if (dbStatus) {
          dbData.status = dbStatus;
          delete dbData.status; // Remove original status
        }
      }
      
      // Convert app field names to DB field names
      const dbMappings: Record<string, string> = {
        clientId: 'cliente_id',
        serviceId: 'servico_id',
        date: 'data_inicio',
        endTime: 'data_fim',
        price: 'preco',
        notes: 'observacoes'
      };
      
      const dbFields: Record<string, any> = {};
      
      // Map app fields to DB fields
      Object.entries(dbData).forEach(([key, value]) => {
        const dbField = dbMappings[key as keyof typeof dbMappings];
        if (dbField) {
          dbFields[dbField] = value;
        } else if (key === 'status') {
          dbFields.status = value;
        } else {
          // Any other fields keep as is
          dbFields[key] = value;
        }
      });
      
      // If status is included, map it
      if (data.status) {
        dbFields.status = mapAppStatusToDbStatus(data.status);
      }

      console.log("useAppointmentOperations: Sending update with fields:", dbFields);
      
      const { error } = await supabase
        .from('agendamentos_novo')
        .update(dbFields)
        .eq('id', id);

      if (error) {
        console.error("useAppointmentOperations: Error updating appointment:", error);
        toast({ 
          title: "Erro", 
          description: "Não foi possível atualizar o agendamento: " + error.message, 
          variant: "destructive" 
        });
        return { success: false, error };
      }

      console.log("useAppointmentOperations: Update successful, refreshing appointments...");
      toast({ 
        title: "Sucesso", 
        description: "Agendamento atualizado com sucesso!" 
      });
      
      // Refresh appointments list
      await refetchAppointments();
      console.log("useAppointmentOperations: Appointments refreshed after update");
      
      return { success: true };
      
    } catch (err: any) {
      console.error("useAppointmentOperations: Unexpected error updating appointment:", err);
      toast({ 
        title: "Erro", 
        description: "Erro inesperado ao atualizar agendamento: " + (err.message || "Erro desconhecido"), 
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
    updateAppointment,
    deleteAppointment
  };
}
