
import { useState, useEffect, useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';
import { Appointment, WhatsAppMessageData } from "@/types";
import { useToast } from "@/hooks/use-toast";

export interface WhatsAppMessageData {
  client?: { phone: string; name: string };
  appointment?: Appointment;
  message?: string;
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .select(`
          *,
          clientes_novo (
            nome,
            telefone,
            id
          ),
          servicos_novo (
            nome,
            preco,
            duracao_em_minutos,
            id
          )
        `);

      if (error) {
        console.error("Error fetching appointments:", error);
        setError(error.message);
      } else {
        // Map the data to the Appointment type
        const mappedAppointments = data ? data.map((item: any) => ({
          id: item.id,
          date: item.date,
          startTime: item.start_time,
          endTime: item.end_time,
          price: item.price,
          clientId: item.cliente,
          serviceId: item.servico,
          notes: item.notes,
          status: item.status,
          cancellationReason: item.motivo_cancelamento,
          client: item.clientes_novo ? {
            id: item.clientes_novo.id,
            name: item.clientes_novo.nome,
            phone: item.clientes_novo.telefone,
          } : undefined,
          service: item.servicos_novo ? {
            id: item.servicos_novo.id,
            name: item.servicos_novo.nome,
            price: item.servicos_novo.preco,
            durationMinutes: item.servicos_novo.duracao_em_minutos,
          } : undefined,
        })) : [];
        setAppointments(mappedAppointments);
        setError(null);
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const getAppointmentsForDate = useCallback((date: Date) => {
    const dateString = date.toISOString().slice(0, 10);
    return appointments.filter(appointment => {
      const appointmentDate = typeof appointment.date === 'string' 
        ? appointment.date 
        : appointment.date.toISOString();
      return appointmentDate.startsWith(dateString);
    });
  }, [appointments]);

  const calculateDailyRevenue = useCallback((date: Date) => {
    const dailyAppointments = getAppointmentsForDate(date);
    return dailyAppointments.reduce((total, appointment) => total + appointment.price, 0);
  }, [getAppointmentsForDate]);

  const generateWhatsAppLink = async (data: WhatsAppMessageData): Promise<string> => {
    if (!data.client || !data.client.phone) {
      return '';
    }
    
    const message = data.message || '';
    if (!message && !data.appointment) {
      return '';
    }
    
    let finalMessage = message;
    if (data.appointment) {
      const formattedDate = new Date(data.appointment.date).toLocaleDateString('pt-BR');
      const appointmentTime = new Date(data.appointment.date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      finalMessage = `Olá! Seu agendamento para ${data.appointment.service?.name || 'serviço'} está confirmado para o dia ${formattedDate} às ${appointmentTime}.`;
    }

    const encodedMessage = encodeURIComponent(finalMessage);
    return `https://wa.me/${data.client.phone}?text=${encodedMessage}`;
  };

  const addAppointment = async (appointmentData: Omit<Appointment, "id">) => {
    try {
      // Remove cancellationReason field if it doesn't have a value to prevent null errors
      const dataToInsert = {
        cliente_id: appointmentData.clientId,
        servico_id: appointmentData.serviceId,
        data_inicio: new Date(appointmentData.date).toISOString(),
        data_fim: appointmentData.endTime ? new Date(appointmentData.endTime).toISOString() : null,
        preco: appointmentData.price,
        status: appointmentData.status,
        observacoes: appointmentData.notes || null
      };
      
      // Only include cancellation reason if it exists and status is canceled
      if (appointmentData.status === 'canceled' && appointmentData.cancellationReason) {
        dataToInsert['motivo_cancelamento'] = appointmentData.cancellationReason;
      }
      
      // Insert the appointment with the cleaned data
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .insert([dataToInsert])
        .select();
      
      if (error) {
        console.error("Error adding appointment:", error);
        return { success: false, error };
      }
      
      // Refresh appointments after adding
      await fetchAppointments();
      return { success: true, data };
    } catch (error) {
      console.error("Error in addAppointment:", error);
      return { success: false, error };
    }
  };

  const updateAppointment = async (id: string, appointmentData: Partial<Appointment>) => {
    try {
      // Map appointment data to DB schema
      const dataToUpdate: Record<string, any> = {};
      
      if (appointmentData.clientId) dataToUpdate.cliente_id = appointmentData.clientId;
      if (appointmentData.serviceId) dataToUpdate.servico_id = appointmentData.serviceId;
      if (appointmentData.date) dataToUpdate.data_inicio = new Date(appointmentData.date).toISOString();
      if (appointmentData.endTime) dataToUpdate.data_fim = new Date(appointmentData.endTime).toISOString();
      if (appointmentData.price) dataToUpdate.preco = appointmentData.price;
      if (appointmentData.status) dataToUpdate.status = appointmentData.status;
      if (appointmentData.notes !== undefined) dataToUpdate.observacoes = appointmentData.notes;
      
      // Only include cancellation reason if status is canceled and it exists
      if (appointmentData.status === 'canceled' && appointmentData.cancellationReason) {
        dataToUpdate.motivo_cancelamento = appointmentData.cancellationReason;
      } else if (appointmentData.status && appointmentData.status !== 'canceled') {
        // If status is changing to non-canceled, remove cancellation reason
        dataToUpdate.motivo_cancelamento = null;
      }
      
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .update(dataToUpdate)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error("Error updating appointment:", error);
        return { success: false, error };
      }
      
      // Refresh appointments after updating
      await fetchAppointments();
      return { success: true, data };
    } catch (error) {
      console.error("Error in updateAppointment:", error);
      return { success: false, error };
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agendamentos_novo')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting appointment:", error);
        return false;
      }
      
      // Refresh appointments after deleting
      await fetchAppointments();
      return true;
    } catch (error) {
      console.error("Error in deleteAppointment:", error);
      return false;
    }
  };

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    getAppointmentsForDate,
    calculateDailyRevenue,
    generateWhatsAppLink,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refetchAppointments: fetchAppointments  // Adding this alias to fix the error
  };
};
