
import React, { createContext, useContext } from "react";
import { DashboardStats, RevenueData, Appointment } from "@/types";
import { ClientProvider, useClients } from "./ClientContext";
import { AppointmentProvider, useAppointments } from "./AppointmentContext";
import { ServiceProvider, useServices } from "./ServiceContext";
import { ExpenseProvider, useExpenses } from "./ExpenseContext";
import { BlockedDateProvider, useBlockedDates } from "./BlockedDateContext";

interface DataContextType {
  dashboardStats: DashboardStats;
  revenueData: RevenueData[];
  loading: boolean;
  error: string | null;

  calculateNetProfit: () => number;
  calculatedMonthlyRevenue: (month?: number, year?: number) => number;
  getRevenueData: () => RevenueData[];
  
  // Update these methods to match their implementation
  fetchBlockedDates: () => Promise<void>;
  fetchAppointments: () => Promise<Appointment[]>; // Updated return type
  addBlockedDate: (blockedDate: any) => Promise<any>;
}

// Create a type that combines all the context types
type CombinedContextType = DataContextType & 
  ReturnType<typeof useClients> & 
  ReturnType<typeof useAppointments> & 
  ReturnType<typeof useServices> &
  ReturnType<typeof useExpenses> &
  ReturnType<typeof useBlockedDates>;

export const DataContext = createContext<CombinedContextType>({
  // Dashboard stats
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
  calculateNetProfit: () => 0,
  calculatedMonthlyRevenue: () => 0,
  getRevenueData: () => [],
  
  // Client context properties
  clients: [],
  getTopClients: () => [],
  refetchClients: async () => {},
  createClient: async () => ({}),
  updateClient: async () => ({}),
  deleteClient: async () => ({}),
  
  // Appointment context properties
  appointments: [],
  getAppointmentsForDate: () => [],
  calculateDailyRevenue: () => 0,
  generateWhatsAppLink: async () => "",
  refetchAppointments: async (): Promise<Appointment[]> => [],
  addAppointment: async () => ({}),
  updateAppointment: async () => ({}),
  fetchAppointments: async (): Promise<Appointment[]> => [],
  
  // Service context properties
  services: [],
  calculateServiceRevenue: () => [],
  addService: async () => ({}),
  updateService: async () => ({}),
  deleteService: async () => ({}),
  fetchServices: async () => [],
  
  // Expense context properties
  expenses: [],
  addExpense: async () => ({}),
  updateExpense: async () => ({}),
  deleteExpense: async () => ({}),
  fetchExpenses: async () => {},
  
  // Blocked dates context properties
  blockedDates: [],
  fetchBlockedDates: async () => {}, 
  addBlockedDate: async () => ({}),
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClientProvider>
      <AppointmentProvider>
        <ServiceProvider>
          <ExpenseProvider>
            <BlockedDateProvider>
              {children}
            </BlockedDateProvider>
          </ExpenseProvider>
        </ServiceProvider>
      </AppointmentProvider>
    </ClientProvider>
  );
};

export const useData = () => useContext(DataContext);
