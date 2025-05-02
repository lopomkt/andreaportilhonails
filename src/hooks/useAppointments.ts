import { useState, useEffect, useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';
import { Appointment, WhatsAppMessageData } from "@/types";
import { useToast } from "@/hooks/use-toast";

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
    return appointments.filter(appointment => appointment.date.startsWith(dateString));
  }, [appointments]);

  const calculateDailyRevenue = useCallback((date: Date) => {
    const dailyAppointments = getAppointmentsForDate(date);
    return dailyAppointments.reduce((total, appointment) => total + appointment.price, 0);
  }, [getAppointmentsForDate]);

  const generateWhatsAppLink = async (data: WhatsAppMessageData): Promise<string> => {
    const { clientPhone, appointmentDate, appointmentTime, serviceName } = data;
    const formattedDate = new Date(appointmentDate).toLocaleDateString('pt-BR');

    const message = `Olá! Seu agendamento para ${serviceName} está confirmado para o dia ${formattedDate} às ${appointmentTime}.`;
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${clientPhone}?text=${encodedMessage}`;
  };

  const addAppointment = async (appointmentData: Omit<Appointment, "id">) => {
    try {
      // Remove cancellationReason field if it doesn't have a value to prevent null errors
      const dataToInsert = { ...appointmentData };
      
      // Only include cancellation reason if it exists and status is canceled
      if (appointmentData.status !== 'canceled' || !appointmentData.cancellationReason) {
        delete dataToInsert.cancellationReason;
      }
      
      // Insert the appointment with the cleaned data
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .insert([dataToInsert])
        .select();
      
      if (error) {
        console.error("Error adding appointment:", error);
        throw error;
      }
      
      // Refresh appointments after adding
      await fetchAppointments();
      return data;
    } catch (error) {
      console.error("Error in addAppointment:", error);
      throw error;
    }
  };

  const updateAppointment = async (id: string, appointmentData: Partial<Appointment>) => {
    try {
      // Remove cancellationReason field if it doesn't have a value to prevent null errors
      const dataToUpdate = { ...appointmentData };
      
      // Only include cancellation reason if it exists and status is canceled
      if (appointmentData.status !== 'canceled' || !appointmentData.cancellationReason) {
        delete dataToUpdate.cancellationReason;
      }
      
      // Update the appointment with the cleaned data
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .update(dataToUpdate)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error("Error updating appointment:", error);
        throw error;
      }
      
      // Refresh appointments after updating
      await fetchAppointments();
      return data;
    } catch (error) {
      console.error("Error in updateAppointment:", error);
      throw error;
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
  };
};
