import { useState, useEffect, useCallback } from 'react';
import { useAppointmentService } from './useAppointmentService';
import { useClients } from './useClients';
import { useServices } from './useServices';
import { useExpenses } from './useExpenses';
import { useBlockedDates } from './useBlockedDates';

import { Appointment, Client, Service, WhatsAppMessageData, DashboardStats, RevenueData } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useUnifiedData() {
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Individual service hooks
  const appointmentService = useAppointmentService();
  const clientsHook = useClients();
  const servicesHook = useServices();
  const expensesHook = useExpenses();
  const blockedDatesHook = useBlockedDates();
const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
  monthRevenue: 0,
  newClients: 0,
  totalAppointments: 0,
  inactiveClients: 0,
  todayAppointments: 0,
  weekAppointments: 0
});
const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  // Unified state
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Load all data
  const loadAllData = useCallback(async () => {
    setGlobalLoading(true);
    setGlobalError(null);
    
    try {
      console.log("useUnifiedData: Loading all data...");
      
      // Load data in parallel
      const [appointmentsData] = await Promise.all([
        appointmentService.fetchAppointments(),
        clientsHook.fetchClients(),
        servicesHook.fetchServices(),
        expensesHook.fetchExpenses(),
        blockedDatesHook.fetchBlockedDates()
      ]);

      setAppointments(appointmentsData);
      
      // Update dashboard stats with fresh appointment data (local calculation)
      if (appointmentsData.length > 0) {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        const weekStart = new Date(todayStart);
        const dayOfWeek = (todayStart.getDay() + 6) % 7; // Monday=0
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const confirmed = appointmentsData.filter(a => a.status === 'confirmed');
        const todayAppointments = confirmed.filter(a => {
          const d = new Date(a.date);
          return d >= todayStart && d <= todayEnd;
        }).length;
        const weekAppointments = confirmed.filter(a => {
          const d = new Date(a.date);
          return d >= weekStart && d <= weekEnd;
        }).length;
        const monthRevenue = confirmed.reduce((sum, a) => {
          const d = new Date(a.date);
          return d >= monthStart && d <= monthEnd ? sum + a.price : sum;
        }, 0);

        setDashboardStats({
          monthRevenue,
          newClients: 0,
          totalAppointments: appointmentsData.length,
          inactiveClients: 0,
          todayAppointments,
          weekAppointments
        });
      }
      
      console.log("useUnifiedData: All data loaded successfully");
    } catch (error: any) {
      console.error("useUnifiedData: Error loading data:", error);
      setGlobalError(error.message || "Erro ao carregar dados");
    } finally {
      setGlobalLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial data load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Appointment operations with auto-refresh
  const addAppointment = useCallback(async (appointment: Omit<Appointment, "id">) => {
    const appointmentData = {
      clienteId: appointment.clientId,
      servicoId: appointment.serviceId,
      data: new Date(appointment.date),
      horaFim: appointment.endTime ? new Date(appointment.endTime) : null,
      preco: appointment.price,
      status: appointment.status,
      observacoes: appointment.notes,
      motivoCancelamento: appointment.cancellationReason
    };
    
    const result = await appointmentService.createAppointment(appointmentData);
    if (result.success) {
      // Refresh appointments
      const updatedAppointments = await appointmentService.fetchAppointments();
      setAppointments(updatedAppointments);
    }
    return result;
  }, [appointmentService]);

  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>) => {
    const result = await appointmentService.updateAppointment(id, data);
    if (result.success) {
      // Refresh appointments
      const updatedAppointments = await appointmentService.fetchAppointments();
      setAppointments(updatedAppointments);
    }
    return result;
  }, [appointmentService]);

  const deleteAppointment = useCallback(async (id: string) => {
    const result = await appointmentService.deleteAppointment(id);
    if (result.success) {
      // Refresh appointments
      const updatedAppointments = await appointmentService.fetchAppointments();
      setAppointments(updatedAppointments);
    }
    return result;
  }, [appointmentService]);

  // Utility functions
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

  const generateWhatsAppLink = useCallback(async (data: WhatsAppMessageData): Promise<string> => {
    const encodedMessage = encodeURIComponent(data.message || "");
    return `https://wa.me/${data.client?.phone}?text=${encodedMessage}`;
  }, []);

  const refetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    const updatedAppointments = await appointmentService.fetchAppointments();
    setAppointments(updatedAppointments);
    return updatedAppointments;
  }, [appointmentService]);

  const fetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    return refetchAppointments();
  }, [refetchAppointments]);

  // Realtime subscriptions for appointments and services
  useEffect(() => {
    const channel = supabase
      .channel('app-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos_novo' }, () => {
        console.log('useUnifiedData: Realtime change on agendamentos_novo, refetching appointments');
        refetchAppointments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, () => {
        console.log('useUnifiedData: Realtime change on servicos, refetching services');
        servicesHook.fetchServices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // State
    appointments,
    clients: clientsHook.clients,
    services: servicesHook.services,
    expenses: expensesHook.expenses,
    blockedDates: blockedDatesHook.blockedDates,
    dashboardStats: dashboardStatsHook.dashboardStats,
    revenueData: dashboardStatsHook.revenueData,
    loading: globalLoading || clientsHook.loading || servicesHook.loading || expensesHook.loading || blockedDatesHook.loading,
    error: globalError || clientsHook.error || servicesHook.error || expensesHook.error || blockedDatesHook.error,

    // Appointment operations
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsForDate,
    calculateDailyRevenue,
    generateWhatsAppLink,
    refetchAppointments,
    fetchAppointments,

    // Client operations
    getTopClients: clientsHook.getTopClients,
    refetchClients: async () => {
      await clientsHook.fetchClients();
    },
    createClient: clientsHook.createClient,
    updateClient: clientsHook.updateClient,
    deleteClient: clientsHook.deleteClient,

    // Service operations
    addService: servicesHook.addService,
    updateService: servicesHook.updateService,
    deleteService: servicesHook.deleteService,
    fetchServices: servicesHook.fetchServices,
    calculateServiceRevenue: servicesHook.calculateServiceRevenue,

    // Expense operations
    addExpense: expensesHook.addExpense,
    updateExpense: expensesHook.updateExpense,
    deleteExpense: expensesHook.deleteExpense,
    fetchExpenses: expensesHook.fetchExpenses,

    // Blocked dates operations
    fetchBlockedDates: blockedDatesHook.fetchBlockedDates,
    addBlockedDate: blockedDatesHook.addBlockedDate,

    // Dashboard operations
    calculateNetProfit: dashboardStatsHook.calculateNetProfit,
    calculatedMonthlyRevenue: (month?: number, year?: number) => 
      dashboardStatsHook.calculatedMonthlyRevenue(appointments, month, year),
    getRevenueData: dashboardStatsHook.getRevenueData,
    calculateExpectedRevenue: () => {
      const now = new Date();
      return appointments
        .filter(appointment => appointment.status === "confirmed" && 
                new Date(appointment.date) > now)
        .reduce((sum, appointment) => sum + appointment.price, 0);
    }
  };
}