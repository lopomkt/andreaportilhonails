
import { createContext, useContext } from 'react';
import { Appointment, BlockedDate, Client, DashboardStats, Expense, MonthlyRevenueData, Service } from '@/types';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface DataContextType {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  blockedDates: BlockedDate[];
  dashboardStats: DashboardStats;
  expenses: Expense[];
  
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<Appointment | null>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  refetchAppointments: () => Promise<Appointment[]>;
  refetchClients: () => Promise<Client[]>;
  
  addService: (service: Omit<Service, "id">) => Promise<Service | null>;
  updateService: (id: string, data: Partial<Service>) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;
  
  addExpense: (expense: Omit<Expense, "id">) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
  
  getAppointmentsForDate: (date: Date) => Appointment[];
  getTopClients: (limit?: number) => Client[];
  calculateDailyRevenue: (date: Date) => number;
  calculateNetProfit: (month?: number, year?: number) => number;
  calculatedMonthlyRevenue: (month?: number, year?: number) => number;
  getRevenueData: () => MonthlyRevenueData[];
  
  generateWhatsAppLink: (data: { client: Client; appointment?: Appointment; message?: string }) => Promise<string>;
}

export const DataContext = createContext<DataContextType>({
  appointments: [],
  clients: [],
  services: [],
  blockedDates: [],
  dashboardStats: {
    todayAppointments: 0,
    weekAppointments: 0,
    monthRevenue: 0,
    inactiveClients: 0,
  },
  expenses: [],
  
  addAppointment: async () => null,
  updateAppointment: async () => false,
  deleteAppointment: async () => false,
  refetchAppointments: async () => [],
  refetchClients: async () => [],
  
  addService: async () => null,
  updateService: async () => false,
  deleteService: async () => false,
  
  addExpense: async () => null,
  deleteExpense: async () => false,
  
  getAppointmentsForDate: () => [],
  getTopClients: () => [],
  calculateDailyRevenue: () => 0,
  calculateNetProfit: () => 0,
  calculatedMonthlyRevenue: () => 0,
  getRevenueData: () => [],
  
  generateWhatsAppLink: async () => ""
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const supabaseData = useSupabaseData();

  const value = {
    appointments: supabaseData.appointments,
    clients: supabaseData.clients,
    services: supabaseData.services,
    blockedDates: supabaseData.blockedDates || [],
    dashboardStats: supabaseData.dashboardStats || {
      todayAppointments: 0,
      weekAppointments: 0,
      monthRevenue: 0,
      inactiveClients: 0,
    },
    expenses: supabaseData.expenses || [],
    
    addAppointment: supabaseData.addAppointment,
    updateAppointment: supabaseData.updateAppointment,
    deleteAppointment: supabaseData.deleteAppointment,
    refetchAppointments: supabaseData.refetchAppointments,
    
    addService: supabaseData.addService || (async () => null),
    updateService: supabaseData.updateService || (async () => false),
    deleteService: supabaseData.deleteService || (async () => false),
    
    addExpense: supabaseData.addExpense || (async () => null),
    deleteExpense: supabaseData.deleteExpense || (async () => false),
    
    getAppointmentsForDate: supabaseData.getAppointmentsForDate || (() => []),
    getTopClients: supabaseData.getTopClients || (() => []),
    calculateDailyRevenue: supabaseData.calculateDailyRevenue || (() => 0),
    calculateNetProfit: supabaseData.calculateNetProfit || (() => 0),
    calculatedMonthlyRevenue: supabaseData.calculatedMonthlyRevenue || (() => 0),
    getRevenueData: supabaseData.getRevenueData || (() => []),
    
    refetchClients: async () => {
      const clients = await supabaseData.fetchClients?.() || [];
      return clients;
    },
    generateWhatsAppLink: supabaseData.generateWhatsAppLink
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
