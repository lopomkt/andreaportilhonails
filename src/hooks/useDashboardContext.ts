
import { Appointment, Client, DashboardStats, RevenueData, Service } from '@/types';
import { useCallback } from 'react';

export const useDashboardContext = (
  appointments: Appointment[],
  clients: Client[],
  services: Service[],
  dashboardStats: DashboardStats
) => {
  const calculateNetProfit = useCallback(() => {
    // Mock expenses calculation
    const expenses = dashboardStats.monthRevenue * 0.3;
    return dashboardStats.monthRevenue - expenses;
  }, [dashboardStats.monthRevenue]);

  const calculatedMonthlyRevenue = useCallback((month?: number, year?: number) => {
    const now = year ? new Date(year, month || 0, 1) : new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return appointments.reduce((sum, appointment) => {
      const appointmentDate = new Date(appointment.date);
      if (
        appointment.status === "confirmed" &&
        appointmentDate >= monthStart &&
        appointmentDate <= monthEnd
      ) {
        return sum + appointment.price;
      }
      return sum;
    }, 0);
  }, [appointments]);

  const getRevenueData = useCallback(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const data: RevenueData[] = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0);

      const monthRevenue = appointments.reduce((sum, appointment) => {
        const appointmentDate = new Date(appointment.date);
        if (
          appointment.status === "confirmed" &&
          appointmentDate >= monthStart &&
          appointmentDate <= monthEnd
        ) {
          return sum + appointment.price;
        }
        return sum;
      }, 0);

      const monthName = monthStart.toLocaleString("default", { month: "long" });
      data.push({ month: monthName, revenue: monthRevenue });
    }

    return data;
  }, [appointments]);

  return {
    dashboardStats,
    calculateNetProfit,
    calculatedMonthlyRevenue,
    getRevenueData
  };
};
