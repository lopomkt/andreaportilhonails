
import { useState, useEffect, useMemo } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useData } from '@/context/DataProvider';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateAvailableTimeSlots } from '@/lib/availabilityCalculator';

export function useDashboardStats() {
  const { appointments, fetchAppointments, error, loading } = useAppointments();
  const { clients } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchAppointments();
      setIsLoading(false);
    };
    loadData();
  }, [fetchAppointments]);

  useEffect(() => {
    if (appointments.length > 0) {
      // Calculate available time slots for today and tomorrow
      const slots = calculateAvailableTimeSlots(appointments, [], new Date(), 7);
      setAvailableTimeSlots(slots.slice(0, 3)); // Show only first 3 suggestions
    }
  }, [appointments]);

  // Filter only confirmed appointments
  const confirmedAppointments = useMemo(() => 
    appointments.filter(app => app.status === "confirmed"),
  [appointments]);

  // Today's stats
  const todayStats = useMemo(() => {
    const now = new Date();
    const startDate = startOfDay(now);
    const endDate = endOfDay(now);
    
    const todaysAppointments = confirmedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: startDate, end: endDate });
    });
    
    const revenue = todaysAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    
    return {
      appointments: todaysAppointments,
      count: todaysAppointments.length,
      revenue
    };
  }, [confirmedAppointments]);

  // This week's stats
  const weekStats = useMemo(() => {
    const now = new Date();
    const startDate = startOfWeek(now, { locale: ptBR });
    const endDate = endOfWeek(now, { locale: ptBR });
    
    const thisWeeksAppointments = confirmedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: startDate, end: endDate });
    });
    
    const revenue = thisWeeksAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    
    return {
      appointments: thisWeeksAppointments,
      count: thisWeeksAppointments.length,
      revenue
    };
  }, [confirmedAppointments]);

  // This month's stats
  const monthStats = useMemo(() => {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);
    
    const thisMonthsAppointments = confirmedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: startDate, end: endDate });
    });
    
    const revenue = thisMonthsAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    
    return {
      appointments: thisMonthsAppointments,
      count: thisMonthsAppointments.length,
      revenue
    };
  }, [confirmedAppointments]);

  // Future stats (upcoming appointments)
  const futureStats = useMemo(() => {
    const now = new Date();
    const endDate = endOfMonth(now);
    
    const futureAppointments = confirmedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isAfter(appointmentDate, now) && isBefore(appointmentDate, endDate);
    });
    
    const revenue = futureAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    
    return {
      appointments: futureAppointments,
      count: futureAppointments.length,
      revenue
    };
  }, [confirmedAppointments]);

  // Calculate average client value
  const averageClientValue = useMemo(() => {
    if (clients.length === 0 || confirmedAppointments.length === 0) return 0;
    
    const totalRevenue = confirmedAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    const uniqueClientIds = new Set(confirmedAppointments.map(appointment => appointment.clientId));
    
    return uniqueClientIds.size > 0 ? totalRevenue / uniqueClientIds.size : 0;
  }, [clients, confirmedAppointments]);

  // Average clients per day
  const avgClientsPerDay = useMemo(() => {
    if (confirmedAppointments.length === 0) return 0;
    
    // Group appointments by day
    const dayMap = new Map();
    
    confirmedAppointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.date);
      const dateKey = appointmentDate.toISOString().split('T')[0];
      
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, new Set());
      }
      
      dayMap.get(dateKey).add(appointment.clientId);
    });
    
    // Calculate average clients per day with activity
    const totalClients = Array.from(dayMap.values()).reduce((sum, clientSet) => sum + clientSet.size, 0);
    const daysWithClients = dayMap.size;
    
    return daysWithClients > 0 ? Math.round((totalClients / daysWithClients) * 10) / 10 : 0;
  }, [confirmedAppointments]);

  return {
    isLoading: isLoading || loading,
    error,
    todayStats,
    weekStats,
    monthStats,
    futureStats,
    availableTimeSlots,
    averageClientValue,
    avgClientsPerDay
  };
}
