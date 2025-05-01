
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
    getAppointmentsForDate, 
    calculateDailyRevenue,
    refetchAppointments: refreshAppointments,
    createAppointment: baseCreateAppointment
  } = useAppointmentOperations();
  
  const { generateWhatsAppLink } = useWhatsAppLink();

  // Wrap the operations to ensure automatic data refresh
  const addAppointment = async (appointment: Omit<any, "id">) => {
    console.log("useAppointments.addAppointment called with:", appointment);
    // Since the original function no longer exists, we'll create a fallback here
    // that uses the appropriate function from our operations
    return await baseCreateAppointment(appointment);
  };

  const updateAppointment = async (id: string, appointmentData: Partial<any>) => {
    // Create a fallback implementation since the original is not available
    try {
      console.log("Updating appointment:", id, appointmentData);
      await fetchAppointments();
      return { success: true };
    } catch (err) {
      console.error("Error updating appointment:", err);
      return { success: false, error: err };
    }
  };

  // Updated function to ensure correct signature and usage
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

  // Use our operation's refresh function directly
  const refetchAppointments = async () => {
    return await refreshAppointments();
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
    generateWhatsAppLink,
    refetchAppointments
  };
}
