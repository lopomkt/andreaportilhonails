
import React, { createContext, useState, useEffect } from "react";
import { useClients } from "@/hooks/useClients";
import { useAppointments } from "@/hooks/useAppointments";
import { useServices } from "@/hooks/useServices";
import { useExpenses } from "@/hooks/useExpenses";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useToast } from "@/hooks/use-toast";
import { 
  Appointment, 
  Client, 
  Service, 
  Expense, 
  BlockedDate, 
  DashboardStats,
  RevenueData,
  WhatsAppMessageData,
  ServiceResponse
} from "@/types";

interface DataContextType {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  expenses: Expense[];
  blockedDates: BlockedDate[];
  dashboardStats: DashboardStats;
  revenueData: RevenueData[];
  loading: boolean;
  error: string | null;
  getAppointmentsForDate: (date: Date) => Appointment[];
  getTopClients: (limit: number) => Client[];
  calculateNetProfit: () => number;
  calculateDailyRevenue: (date: Date) => number;
  calculatedMonthlyRevenue: (month?: number, year?: number) => number;
  calculateServiceRevenue: (
    appointments: Appointment[],
    services: Service[]
  ) => { name: string; value: number; count: number }[];
  getRevenueData: () => RevenueData[];
  generateWhatsAppLink: (data: WhatsAppMessageData) => Promise<string>;
  refetchAppointments: () => Promise<void>;
  refetchClients: () => Promise<void>;
  createClient: (clientData: any) => Promise<any>;
  updateClient: (clientId: string, clientData: any) => Promise<any>;
  deleteClient: (clientId: string) => Promise<any>;
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<any>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<any>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<any>;
  deleteExpense: (id: string) => Promise<any>;
  addService: (service: Omit<Service, "id">) => Promise<any>;
  updateService: (id: string, data: Partial<Service>) => Promise<any>;
  deleteService: (id: string) => Promise<any>;
}

export const DataContext = createContext<DataContextType>({
  appointments: [],
  clients: [],
  services: [],
  expenses: [],
  blockedDates: [],
  dashboardStats: {
    monthRevenue: 0,
    newClients: 0,
    totalAppointments: 0,
    inactiveClients: 0,
    todayAppointments: 0,
    weekAppointments: 0,
  },
  revenueData: [],
  loading: false,
  error: null,
  getAppointmentsForDate: () => [],
  getTopClients: () => [],
  calculateNetProfit: () => 0,
  calculateDailyRevenue: () => 0,
  calculatedMonthlyRevenue: () => 0,
  calculateServiceRevenue: () => [],
  getRevenueData: () => [],
  generateWhatsAppLink: async () => "",
  refetchAppointments: async () => {},
  refetchClients: async () => {},
  createClient: async () => ({}),
  updateClient: async () => ({}),
  deleteClient: async () => ({}),
  addAppointment: async () => ({}),
  updateAppointment: async () => ({}),
  addExpense: async () => ({}),
  deleteExpense: async () => ({}),
  addService: async () => ({}),
  updateService: async () => ({}),
  deleteService: async () => ({}),
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize all the hooks
  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getTopClients,
  } = useClients();

  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    fetchAppointments,
    addAppointment,
    updateAppointment,
    getAppointmentsForDate,
    calculateDailyRevenue,
    generateWhatsAppLink,
  } = useAppointments();

  const {
    services,
    loading: servicesLoading,
    error: servicesError,
    fetchServices,
    addService,
    updateService,
    deleteService,
    calculateServiceRevenue,
  } = useServices();

  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    fetchExpenses,
    addExpense,
    deleteExpense,
  } = useExpenses();

  const {
    blockedDates,
    loading: blockedDatesLoading,
    error: blockedDatesError,
    fetchBlockedDates,
  } = useBlockedDates();

  const {
    dashboardStats,
    revenueData,
    calculateNetProfit,
    calculatedMonthlyRevenue,
    getRevenueData,
  } = useDashboardStats(appointments);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAppointments(),
          fetchClients(),
          fetchServices(),
          fetchExpenses(),
          fetchBlockedDates()
        ]);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchAppointments, fetchClients, fetchServices, fetchExpenses, fetchBlockedDates]);

  // Update global loading and error states
  useEffect(() => {
    const isLoading = clientsLoading || appointmentsLoading || servicesLoading || expensesLoading || blockedDatesLoading;
    setLoading(isLoading);

    const firstError = clientsError || appointmentsError || servicesError || expensesError || blockedDatesError;
    setError(firstError);
  }, [
    clientsLoading, appointmentsLoading, servicesLoading, expensesLoading, blockedDatesLoading,
    clientsError, appointmentsError, servicesError, expensesError, blockedDatesError
  ]);

  // Public refetch methods
  const refetchAppointments = async () => {
    await fetchAppointments();
  };

  const refetchClients = async () => {
    await fetchClients();
  };

  return (
    <DataContext.Provider
      value={{
        appointments,
        clients,
        services,
        expenses,
        blockedDates,
        dashboardStats,
        revenueData,
        loading,
        error,
        getAppointmentsForDate,
        getTopClients,
        calculateNetProfit,
        calculateDailyRevenue,
        calculatedMonthlyRevenue,
        calculateServiceRevenue,
        getRevenueData,
        generateWhatsAppLink,
        refetchAppointments,
        refetchClients,
        createClient,
        updateClient,
        deleteClient,
        addAppointment,
        updateAppointment,
        addExpense,
        deleteExpense,
        addService,
        updateService,
        deleteService,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
