import React, { createContext, useState, useEffect, useCallback } from "react";
import { useClients } from "@/hooks/useClients";
import { useAppointments } from "@/hooks/useAppointments";
import { useServices } from "@/hooks/useServices";
import { useExpenses } from "@/hooks/useExpenses";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useToast } from "@/hooks/use-toast";
import { useClientContext } from "@/hooks/useClientContext";
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
import { startOfMonth, endOfMonth, isWithinInterval, isFuture } from "date-fns";

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
  calculateExpectedRevenue: () => number; // New method
  generateWhatsAppLink: (data: WhatsAppMessageData) => Promise<string>;
  refetchAppointments: () => Promise<Appointment[]>;
  refetchClients: () => Promise<void>;
  createClient: (clientData: any) => Promise<any>;
  updateClient: (clientId: string, clientData: any) => Promise<any>;
  deleteClient: (clientId: string) => Promise<any>;
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<any>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<any>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<any>;
  updateExpense: (expense: Expense) => Promise<any>;
  deleteExpense: (id: string) => Promise<any>;
  addService: (service: Omit<Service, "id">) => Promise<any>;
  updateService: (id: string, data: Partial<Service>) => Promise<any>;
  deleteService: (id: string) => Promise<any>;
  fetchBlockedDates: () => Promise<void>;
  fetchAppointments: () => Promise<Appointment[]>; 
  addBlockedDate: (blockedDate: Omit<BlockedDate, "id">) => Promise<any>;
  fetchServices: () => Promise<Service[]>; 
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
    weekAppointments: 0
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
  calculateExpectedRevenue: () => 0, // New method
  generateWhatsAppLink: async () => "",
  refetchAppointments: async () => [],
  refetchClients: async () => {},
  createClient: async () => ({}),
  updateClient: async () => ({}),
  deleteClient: async () => ({}),
  addAppointment: async () => ({}),
  updateAppointment: async () => ({}),
  addExpense: async () => ({}),
  updateExpense: async () => ({}),
  deleteExpense: async () => ({}),
  addService: async () => ({}),
  updateService: async () => ({}),
  deleteService: async () => ({}),
  fetchBlockedDates: async () => {},
  fetchAppointments: async () => [], 
  addBlockedDate: async () => ({}),
  fetchServices: async () => [],
});

export const useData = () => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetchClients = async () => {
  try {
    const updatedClients = await clientService.getAll();
    setClients(updatedClients);
  } catch (error) {
    console.error("Erro ao atualizar a lista de clientes:", error);
    toast({
      title: "Erro ao buscar clientes",
      description: "Não foi possível atualizar os clientes. Tente novamente.",
      variant: "destructive",
    });
  }
};

  // Using existing hooks
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
    updateExpense,
    deleteExpense,
  } = useExpenses();

  const {
    blockedDates,
    loading: blockedDatesLoading,
    error: blockedDatesError,
    fetchBlockedDates,
    addBlockedDate,
  } = useBlockedDates();

  // Use the dashboard stats hook
  const {
    dashboardStats,
    revenueData,
    calculateNetProfit,
    calculatedMonthlyRevenue,
    getRevenueData,
    updateDashboardStats
  } = useDashboardStats();
  
  // Update dashboard stats when appointments change
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      updateDashboardStats(appointments); // Pass appointments as required
    }
  }, [appointments, updateDashboardStats]);
  
  // Calculate expected revenue from future confirmed appointments
  const calculateExpectedRevenue = useCallback(() => {
    const now = new Date();
    
    return appointments
      .filter(appointment => appointment.status === "confirmed" && 
              new Date(appointment.date) > now)
      .reduce((sum, appointment) => sum + appointment.price, 0);
  }, [appointments]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log("DataProvider: Loading data...");
        await Promise.all([
          fetchAppointments(),
          fetchClients(),
          fetchServices(),
          fetchExpenses(),
          fetchBlockedDates()
        ]);
        console.log("DataProvider: All data loaded");
      } catch (err: any) {
        const errorMsg = err.message || "Erro ao carregar os dados.";
        console.error("DataProvider error:", errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const isLoading = clientsLoading || appointmentsLoading || servicesLoading || expensesLoading || blockedDatesLoading;
    setLoading(isLoading);

    const firstError = clientsError || appointmentsError || servicesError || expensesError || blockedDatesError;
    setError(firstError);
  }, [
    clientsLoading, appointmentsLoading, servicesLoading, expensesLoading, blockedDatesLoading,
    clientsError, appointmentsError, servicesError, expensesError, blockedDatesError
  ]);

  // Define refetchAppointments for DataContext
  const refetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    console.log("DataProvider: refetchAppointments called");
    return await fetchAppointments();
  }, [fetchAppointments]);

  // Modified to use the enhanced monthly revenue calculation
  const wrappedCalculatedMonthlyRevenue = useCallback((month?: number, year?: number) => {
    const targetDate = year && month !== undefined 
      ? new Date(year, month, 1) 
      : new Date();
    
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    
    return appointments
      .filter(appointment => appointment.status === "confirmed")
      .reduce((sum, appointment) => {
        const appointmentDate = new Date(appointment.date);
        if (isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd })) {
          return sum + appointment.price;
        }
        return sum;
      }, 0);
  }, [appointments]);

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
        calculatedMonthlyRevenue: wrappedCalculatedMonthlyRevenue,
        calculateServiceRevenue,
        getRevenueData,
        calculateExpectedRevenue,
        generateWhatsAppLink,
        refetchAppointments,
        refetchClients,
        createClient,
        updateClient,
        deleteClient,
        addAppointment,
        updateAppointment,
        addExpense,
        updateExpense,
        deleteExpense,
        addService,
        updateService,
        deleteService,
        fetchBlockedDates,
        fetchAppointments,
        addBlockedDate,
        fetchServices,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
