import { useState, useEffect, useCallback } from 'react';
import { useAppointmentService } from './useAppointmentService';
import { useClients } from './useClients';
import { useServices } from './useServices';
import { useExpenses } from './useExpenses';
import { useBlockedDates } from './useBlockedDates';
import { useDashboardStats } from './useDashboardStats';
import { Appointment, Client, Service, WhatsAppMessageData } from '@/types';

export function useUnifiedData() {
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Individual service hooks
  const appointmentService = useAppointmentService();
  const clientsHook = useClients();
  const servicesHook = useServices();
  const expensesHook = useExpenses();
  const blockedDatesHook = useBlockedDates();
  const dashboardStatsHook = useDashboardStats();

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
      
      // Update dashboard stats with fresh appointment data
      if (appointmentsData.length > 0) {
        dashboardStatsHook.updateDashboardStats(appointmentsData);
      }
      
      console.log("useUnifiedData: All data loaded successfully");
    } catch (error: any) {
      console.error("useUnifiedData: Error loading data:", error);
      setGlobalError(error.message || "Erro ao carregar dados");
    } finally {
      setGlobalLoading(false);
    }
  }, [appointmentService.fetchAppointments, clientsHook.fetchClients, servicesHook.fetchServices, expensesHook.fetchExpenses, blockedDatesHook.fetchBlockedDates, dashboardStatsHook.updateDashboardStats]);

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