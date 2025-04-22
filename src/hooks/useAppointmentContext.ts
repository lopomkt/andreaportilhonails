import { supabase } from '@/integrations/supabase/client';
import { appointmentService } from '@/integrations/supabase/appointmentService';
import { Appointment, AppointmentStatus, WhatsAppMessageData, Service } from '@/types';
import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export const useAppointmentContext = (
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>,
  appointments: Appointment[]
) => {
  const fetchAppointments = async (): Promise<void> => {
    try {
      const appointmentsData = await appointmentService.getAll();
      if (!appointmentsData) {
        console.error('Error: No appointments data returned');
        return;
      }
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Erro ao carregar agendamentos',
        description: 'Ocorreu um erro ao carregar os agendamentos. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
  };

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

  const calculateDailyRevenue = useCallback((date: Date): number => {
    return getAppointmentsForDate(date).reduce(
      (total, appointment) => total + appointment.price,
      0
    );
  }, [getAppointmentsForDate]);

  const addAppointment = useCallback(async (appointment: Omit<Appointment, "id">) => {
    try {
      if (!appointment) {
        return { success: false, error: "Invalid appointment data" };
      }
      
      const response = await appointmentService.create(appointment);
      
      if (!response) {
        console.error("Error adding appointment: null response");
        return { success: false, error: "Failed to add appointment" };
      }
      
      await fetchAppointments();
      
      // Return success with data as object type
      if (response && typeof response === 'object') {
        return { 
          success: true, 
          data: response 
        };
      }
      
      // Fallback success response
      return { success: true };
    } catch (error) {
      console.error("Error adding appointment:", error);
      return { success: false, error };
    }
  }, [fetchAppointments]);

  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>) => {
    try {
      if (!id || !data) {
        return { success: false, error: "Invalid appointment data" };
      }

      const response = await appointmentService.update(id, data);
      
      if (!response) {
        console.error("Error updating appointment: null response");
        return { success: false, error: "Failed to update appointment" };
      }
      
      await fetchAppointments();
      
      // For boolean results, return a simple success object
      if (typeof response === 'boolean') {
        return { 
          success: response,
          data: { success: response }
        };
      }
      
      // Return success with data as object type
      if (response && typeof response === 'object') {
        return { 
          success: true, 
          data: response 
        };
      }
      
      // Fallback success response
      return { success: true };
    } catch (error) {
      console.error("Error updating appointment:", error);
      return { success: false, error };
    }
  }, [fetchAppointments]);

  const generateWhatsAppLink = async (data: WhatsAppMessageData): Promise<string> => {
    const encodedMessage = encodeURIComponent(data.message || "");
    return `https://wa.me/${data.client?.phone}?text=${encodedMessage}`;
  };

  return {
    fetchAppointments,
    getAppointmentsForDate,
    calculateDailyRevenue,
    addAppointment,
    updateAppointment,
    generateWhatsAppLink
  };
};
