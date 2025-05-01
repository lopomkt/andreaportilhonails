
import { useState, useCallback, useEffect } from 'react';
import { Appointment, DashboardStats, RevenueData } from '@/types';

export function useDashboardStats() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    monthRevenue: 0,
    newClients: 0,
    totalAppointments: 0,
    inactiveClients: 0,
    todayAppointments: 0,
    weekAppointments: 0,
  });
  
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  const updateDashboardStats = useCallback((appointments: Appointment[]) => {
    if (!appointments || appointments.length === 0) return;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // Count appointments
    const confirmedAppointments = appointments.filter(app => app.status === 'confirmed');
    const monthAppointments = confirmedAppointments.filter(
      app => new Date(app.date) >= startOfMonth && new Date(app.date) <= now
    );
    const todayAppointments = confirmedAppointments.filter(
      app => new Date(app.date).toDateString() === startOfToday.toDateString()
    );
    const weekAppointments = confirmedAppointments.filter(
      app => new Date(app.date) >= startOfWeek && new Date(app.date) <= now
    );

    // Calculate revenue
    const monthRevenue = monthAppointments.reduce((total, app) => total + app.price, 0);

    // Count unique clients in the current month
    const uniqueClients = new Set();
    confirmedAppointments.forEach(app => {
      uniqueClients.add(app.clientId);
    });

    // Generate mock stats since we don't have all the data available
    const newStats: DashboardStats = {
      monthRevenue: monthRevenue,
      totalAppointments: confirmedAppointments.length,
      newClients: Math.floor(uniqueClients.size * 0.2), // Simulate 20% are new
      inactiveClients: Math.floor(uniqueClients.size * 0.15), // Simulate 15% are inactive
      todayAppointments: todayAppointments.length,
      weekAppointments: weekAppointments.length
    };

    setDashboardStats(newStats);
  }, []);

  const calculateNetProfit = useCallback(() => {
    // Mock expenses calculation (30% of revenue)
    const expenses = dashboardStats.monthRevenue * 0.3;
    return dashboardStats.monthRevenue - expenses;
  }, [dashboardStats.monthRevenue]);

  const calculatedMonthlyRevenue = useCallback((appointments: Appointment[], month?: number, year?: number) => {
    if (!appointments || appointments.length === 0) return 0;
    
    const now = year ? new Date(year, month || 0, 1) : new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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

    return monthRevenue;
  }, []);

  const getRevenueData = useCallback((appointments: Appointment[]) => {
    if (!appointments || appointments.length === 0) {
      return [];
    }
    
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

    setRevenueData(data);
    return data;
  }, []);

  return {
    dashboardStats,
    revenueData,
    calculateNetProfit,
    calculatedMonthlyRevenue,
    getRevenueData,
    updateDashboardStats
  };
}
