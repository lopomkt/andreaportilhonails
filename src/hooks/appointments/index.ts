
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
    console.log("useAppointments.addAppointment called with:", appointment);
    const result = await baseAddAppointment(appointment);
    console.log("useAppointments.addAppointment result:", result);
    if (result.success) {
      console.log("Fetching appointments after successful add");
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
    console.log("useAppointments.createAppointment called with:", appointment);
    
    // Validate all required fields
    if (!appointment.clienteId || !appointment.servicoId || !appointment.data) {
      console.error("Missing required fields for appointment creation");
      return { success: false, error: { message: 'Cliente, serviço e data são obrigatórios' } };
    }
    
    const result = await baseCreateAppointment(appointment);
    console.log("useAppointments.createAppointment result:", result);
    if (result.success) {
      console.log("Fetching appointments after successful creation");
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
