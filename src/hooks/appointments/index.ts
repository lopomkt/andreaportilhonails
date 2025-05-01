
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
    createAppointment: baseCreateAppointment,
    updateAppointment: baseUpdateAppointment,
    deleteAppointment: baseDeleteAppointment
  } = useAppointmentOperations();
  
  const { generateWhatsAppLink } = useWhatsAppLink();

  // Wrap the operations to ensure automatic data refresh
  const addAppointment = async (appointment: Omit<any, "id">) => {
    console.log("useAppointments.addAppointment called with:", appointment);
    // Transform the appointment data to match what baseCreateAppointment expects
    const transformedData = {
      clienteId: appointment.clientId || "",
      servicoId: appointment.serviceId || "",
      data: appointment.date ? new Date(appointment.date) : new Date(),
      horaFim: appointment.endTime ? new Date(appointment.endTime) : new Date(),
      preco: appointment.price || 0,
      status: appointment.status || "pending",
      observacoes: appointment.notes || ""
    };
    
    return await baseCreateAppointment(transformedData);
  };

  const updateAppointment = async (id: string, appointmentData: Partial<any>) => {
    console.log("useAppointments.updateAppointment called with:", id, appointmentData);
    return await baseUpdateAppointment(id, appointmentData);
  };

  const deleteAppointment = async (id: string) => {
    console.log("useAppointments.deleteAppointment called with:", id);
    return await baseDeleteAppointment(id);
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
    deleteAppointment,
    createAppointment,
    getAppointmentsForDate,
    calculateDailyRevenue,
    generateWhatsAppLink,
    refetchAppointments
  };
}
