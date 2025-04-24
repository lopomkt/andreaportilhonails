
import { useCallback } from 'react';
import { Appointment, ServiceResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useDataContext } from './useDataContext';

export function useAppointmentOperations() {
  const { appointments, fetchAppointments } = useDataContext();
  const { toast } = useToast();

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

  const refetchAppointments = useCallback(async (): Promise<void> => {
    console.log("DataContext: refetchAppointments called");
    await fetchAppointments();
  }, [fetchAppointments]);

  return {
    getAppointmentsForDate,
    calculateDailyRevenue,
    refetchAppointments,
  };
}
