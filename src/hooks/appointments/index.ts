
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
    addAppointment, 
    updateAppointment 
  } = useAppointmentOperations(setAppointments);
  
  const { 
    getAppointmentsForDate, 
    calculateDailyRevenue 
  } = useAppointmentQueries(appointments);
  
  const { generateWhatsAppLink } = useWhatsAppLink();

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    addAppointment,
    updateAppointment,
    getAppointmentsForDate,
    calculateDailyRevenue,
    generateWhatsAppLink
  };
}
