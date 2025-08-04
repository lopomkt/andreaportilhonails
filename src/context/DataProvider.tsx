import React, { createContext, useCallback } from "react";
import { useUnifiedData } from "@/hooks/useUnifiedData";
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
  calculateExpectedRevenue: () => number; // New method
  generateWhatsAppLink: (data: WhatsAppMessageData) => Promise<string>;
  refetchAppointments: () => Promise<Appointment[]>;
  refetchClients: () => Promise<void>;
  createClient: (clientData: any) => Promise<any>;
  updateClient: (clientId: string, clientData: any) => Promise<any>;
  deleteClient: (clientId: string) => Promise<any>;
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<any>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<any>;
  deleteAppointment: (id: string) => Promise<any>;
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
  deleteAppointment: async () => ({}),
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
  // Use the unified data hook for simplified state management
  const unifiedData = useUnifiedData();

  const refetchClients = useCallback(async () => {
    await unifiedData.refetchClients();
  }, [unifiedData]);

  return (
    <DataContext.Provider
      value={{
        ...unifiedData,
        refetchClients
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
