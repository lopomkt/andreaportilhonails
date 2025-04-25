
import React, { createContext, useContext } from "react";
import { DashboardStats, RevenueData } from "@/types";
import { ClientProvider, useClients } from "./ClientContext";
import { AppointmentProvider, useAppointments } from "./AppointmentContext";
import { ServiceProvider, useServices } from "./ServiceContext";

interface DataContextType {
  dashboardStats: DashboardStats;
  revenueData: RevenueData[];
  loading: boolean;
  error: string | null;

  calculateNetProfit: () => number;
  calculatedMonthlyRevenue: (month?: number, year?: number) => number;
  getRevenueData: () => RevenueData[];
}

// Create a type that combines all the context types
type CombinedContextType = DataContextType & 
  ReturnType<typeof useClients> & 
  ReturnType<typeof useAppointments> & 
  ReturnType<typeof useServices>;

export const DataContext = createContext<CombinedContextType>({
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
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClientProvider>
      <AppointmentProvider>
        <ServiceProvider>
          {children}
        </ServiceProvider>
      </AppointmentProvider>
    </ClientProvider>
  );
};

export const useData = () => useContext(DataContext);
