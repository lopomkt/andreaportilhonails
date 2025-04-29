
import { useAppointmentsData } from './useAppointmentsData';
import { useAppointmentOperations } from './useAppointmentOperations';
import { useAppointmentQueries } from './useAppointmentQueries';
import { useWhatsAppLink } from './useWhatsAppLink';

export function useAppointments() {
  const { 
    appointments, 
    loading, 
    error, 
    fetchAppointments, 
    setAppointments 
  } = useAppointmentsData();
  
  const { 
    addAppointment: baseAddAppointment, 
    updateAppointment: baseUpdateAppointment,
    createAppointment: baseCreateAppointment 
  } = useAppointmentOperations(setAppointments);
  
  const { 
    getAppointmentsForDate, 
    calculateDailyRevenue 
  } = useAppointmentQueries(appointments);
  
  const { generateWhatsAppLink } = useWhatsAppLink();

  // Wrap the operations to ensure automatic data refresh
  const addAppointment = async (appointment: Omit<any, "id">) => {
    const result = await baseAddAppointment(appointment);
    if (result.success) {
      await fetchAppointments();
    }
    return result;
  };

  const updateAppointment = async (id: string, appointmentData: Partial<any>) => {
    const result = await baseUpdateAppointment(id, appointmentData);
    if (result.success) {
      await fetchAppointments();
    }
    return result;
  };

  const createAppointment = async (appointment: any) => {
    const result = await baseCreateAppointment(appointment);
    if (result.success) {
      await fetchAppointments();
    }
    return result;
  };

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    addAppointment,
    updateAppointment,
    createAppointment,
    getAppointmentsForDate,
    calculateDailyRevenue,
    generateWhatsAppLink
  };
}
