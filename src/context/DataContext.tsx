
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Appointment,
  Client,
  DashboardStats,
  Service,
  BlockedDate,
  AppointmentStatus,
  Expense,
  WhatsAppMessageData,
  MonthlyRevenueData,
  RevenueData
} from "@/types";
import { useClientContext } from "@/hooks/useClientContext";
import { useAppointmentContext } from "@/hooks/useAppointmentContext";
import { useServiceContext } from "@/hooks/useServiceContext";
import { useExpenseContext } from "@/hooks/useExpenseContext";
import { useBlockedDateContext } from "@/hooks/useBlockedDateContext";
import { useDashboardContext } from "@/hooks/useDashboardContext";

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
  updateExpense: (expense: Expense) => Promise<any>; // Add this method
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
  // Estado compartilhado
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    monthRevenue: 0,
    newClients: 0,
    totalAppointments: 0,
    inactiveClients: 0,
    todayAppointments: 0,
    weekAppointments: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  // Initializing all context providers
  const appointmentContext = useAppointmentContext(setAppointments, appointments);
  
  const clientContext = useClientContext(
    setClients, 
    appointmentContext.fetchAppointments, 
    clients
  );
  
  const serviceContext = useServiceContext(setServices, services);
  
  const expenseContext = useExpenseContext(expenses, setExpenses); // Added setExpenses param
  
  const blockedDateContext = useBlockedDateContext(setBlockedDates, blockedDates);
  
  const dashboardContext = useDashboardContext(
    appointments,
    clients,
    services,
    dashboardStats
  );

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          appointmentContext.fetchAppointments(),
          clientContext.fetchClients(),
          serviceContext.fetchServices(),
          expenseContext.fetchExpenses(),
          blockedDateContext.fetchBlockedDates()
        ]);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Public refetch methods with void return type
  const refetchAppointments = async (): Promise<void> => {
    console.log("DataContext: refetchAppointments called");
    await appointmentContext.fetchAppointments();
  };

  const refetchClients = async (): Promise<void> => {
    console.log("DataContext: refetchClients called");
    await clientContext.fetchClients();
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
        getAppointmentsForDate: appointmentContext.getAppointmentsForDate,
        getTopClients: clientContext.getTopClients,
        calculateNetProfit: dashboardContext.calculateNetProfit,
        calculateDailyRevenue: appointmentContext.calculateDailyRevenue,
        calculatedMonthlyRevenue: dashboardContext.calculatedMonthlyRevenue,
        calculateServiceRevenue: serviceContext.calculateServiceRevenue,
        getRevenueData: dashboardContext.getRevenueData,
        generateWhatsAppLink: appointmentContext.generateWhatsAppLink,
        refetchAppointments,
        refetchClients,
        createClient: clientContext.createClient,
        updateClient: clientContext.updateClient,
        deleteClient: clientContext.deleteClient,
        addAppointment: appointmentContext.addAppointment,
        updateAppointment: appointmentContext.updateAppointment,
        addExpense: expenseContext.addExpense,
        deleteExpense: expenseContext.deleteExpense,
        addService: serviceContext.addService,
        updateService: serviceContext.updateService,
        deleteService: serviceContext.deleteService,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
