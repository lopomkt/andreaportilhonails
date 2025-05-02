
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useData } from '@/context/DataProvider';
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  isWithinInterval, isBefore, isAfter, isFuture, isToday, format, addMonths 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateAvailableTimeSlots } from '@/lib/availabilityCalculator';
import { Appointment, DashboardStats, RevenueData } from '@/types';
import { normalizeDate } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';

export function useDashboardStats() {
  const { toast } = useToast();
  const { appointments, fetchAppointments, error, loading } = useAppointments();
  const { clients, blockedDates } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  
  // Set dashboard stats using the data from useMemo hooks
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    monthRevenue: 0,
    newClients: 0,
    totalAppointments: 0,
    inactiveClients: 0,
    todayAppointments: 0,
    weekAppointments: 0
  });

  // Store revenue data
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchAppointments();
      } catch (err) {
        toast({
          title: "Erro ao carregar agendamentos",
          description: "Não foi possível buscar os agendamentos para o dashboard.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchAppointments, toast]);

  useEffect(() => {
    if (appointments.length > 0) {
      try {
        // Calculate available time slots for today and tomorrow
        const slots = calculateAvailableTimeSlots(appointments, blockedDates || [], new Date(), 7);
        setAvailableTimeSlots(slots.slice(0, 3)); // Show only first 3 suggestions
      } catch (err) {
        console.error("Erro ao calcular horários disponíveis:", err);
      }
    }
  }, [appointments, blockedDates]);

  // Filter only confirmed appointments - avoid recomputing this
  const confirmedAppointments = useMemo(() => 
    appointments.filter(app => app.status === "confirmed"),
  [appointments]);

  // Today's stats
  const todayStats = useMemo(() => {
    const now = new Date();
    const startDate = startOfDay(now);
    const endDate = endOfDay(now);
    
    const todaysAppointments = confirmedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: startDate, end: endDate });
    });
    
    const revenue = todaysAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    
    return {
      appointments: todaysAppointments,
      count: todaysAppointments.length,
      revenue
    };
  }, [confirmedAppointments]);

  // This week's stats
  const weekStats = useMemo(() => {
    const now = new Date();
    const startDate = startOfWeek(now, { locale: ptBR });
    const endDate = endOfWeek(now, { locale: ptBR });
    
    const thisWeeksAppointments = confirmedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: startDate, end: endDate });
    });
    
    const revenue = thisWeeksAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    
    return {
      appointments: thisWeeksAppointments,
      count: thisWeeksAppointments.length,
      revenue
    };
  }, [confirmedAppointments]);

  // This month's stats - fixed calculation
  const monthStats = useMemo(() => {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);
    
    const thisMonthsAppointments = confirmedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(normalizeDate(appointmentDate), { 
        start: normalizeDate(startDate), 
        end: normalizeDate(endDate) 
      });
    });
    
    const revenue = thisMonthsAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    
    return {
      appointments: thisMonthsAppointments,
      count: thisMonthsAppointments.length,
      revenue
    };
  }, [confirmedAppointments]);

  // Projected future revenue - moved from Dashboard.tsx
  const projectedRevenue = useMemo(() => {
    const now = new Date();
    const lastDayOfMonth = endOfMonth(now);
    
    const futureAppointments = confirmedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isFuture(appointmentDate) && isBefore(appointmentDate, lastDayOfMonth);
    });
    
    return futureAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
  }, [confirmedAppointments]);

  // Calculate average client value
  const averageClientValue = useMemo(() => {
    if (confirmedAppointments.length === 0) return 0;
    
    const totalRevenue = confirmedAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    const uniqueClientIds = new Set(confirmedAppointments.map(appointment => appointment.clientId));
    
    return uniqueClientIds.size > 0 ? totalRevenue / uniqueClientIds.size : 0;
  }, [confirmedAppointments]);

  // Average clients per day
  const avgClientsPerDay = useMemo(() => {
    if (confirmedAppointments.length === 0) return 0;
    
    // Group appointments by day
    const dayMap = new Map();
    
    confirmedAppointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.date);
      const dateKey = appointmentDate.toISOString().split('T')[0];
      
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, new Set());
      }
      
      dayMap.get(dateKey).add(appointment.clientId);
    });
    
    // Calculate average clients per day with activity
    const totalClients = Array.from(dayMap.values()).reduce((sum, clientSet) => sum + clientSet.size, 0);
    const daysWithClients = dayMap.size;
    
    return daysWithClients > 0 ? Math.round((totalClients / daysWithClients) * 10) / 10 : 0;
  }, [confirmedAppointments]);
  
  // Monthly revenue count - CORRECTED
  const monthlyAppointmentsCount = useMemo(() => {
    return monthStats.count;
  }, [monthStats]);
  
  // Update dashboard stats based on calculated values
  useEffect(() => {
    setDashboardStats({
      monthRevenue: monthStats.revenue,
      newClients: 0, // Would need to calculate this based on client creation dates
      totalAppointments: appointments.length,
      inactiveClients: 0, // Would need to calculate this based on client activity
      todayAppointments: todayStats.count,
      weekAppointments: weekStats.count
    });
  }, [appointments.length, todayStats.count, weekStats.count, monthStats.revenue]);
  
  // Get revenue data for charts with useCallback
  const getRevenueData = useCallback(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthlyRevenueData: RevenueData[] = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0);

      const monthRevenue = confirmedAppointments.reduce((sum, appointment) => {
        const appointmentDate = new Date(appointment.date);
        if (isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd })) {
          return sum + appointment.price;
        }
        return sum;
      }, 0);

      const monthName = monthStart.toLocaleString("default", { month: "long" });
      monthlyRevenueData.push({ month: monthName, revenue: monthRevenue });
    }

    setRevenueData(monthlyRevenueData);
    return monthlyRevenueData;
  }, [confirmedAppointments]);
  
  // Calculate monthly revenue for specific month/year with useCallback
  const calculatedMonthlyRevenue = useCallback((appointments: Appointment[], month?: number, year?: number) => {
    const now = year ? new Date(year, month || 0, 1) : new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return appointments
      .filter(appointment => appointment.status === "confirmed")
      .reduce((sum, appointment) => {
        const appointmentDate = new Date(appointment.date);
        if (isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd })) {
          return sum + appointment.price;
        }
        return sum;
      }, 0);
  }, []);

  // Calculate net profit with useCallback
  const calculateNetProfit = useCallback(() => {
    // Simplified calculation, in a real app you would subtract expenses
    const expenses = monthStats.revenue * 0.3; // Assume expenses are 30% of revenue
    return monthStats.revenue - expenses;
  }, [monthStats.revenue]);
  
  // Function to update dashboard stats (used by DataProvider)
  const updateDashboardStats = useCallback((currentAppointments: Appointment[]) => {
    const confirmedApps = currentAppointments.filter(app => app.status === "confirmed");
    
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    
    const todayCount = confirmedApps.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: todayStart, end: todayEnd });
    }).length;
    
    const weekStart = startOfWeek(today, { locale: ptBR });
    const weekEnd = endOfWeek(today, { locale: ptBR });
    
    const weekCount = confirmedApps.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: weekStart, end: weekEnd });
    }).length;
    
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    
    const monthRevenue = confirmedApps.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd });
    }).reduce((sum, appointment) => sum + appointment.price, 0);
    
    setDashboardStats({
      monthRevenue,
      newClients: 0, // Would need to calculate
      totalAppointments: currentAppointments.length,
      inactiveClients: 0, // Would need to calculate
      todayAppointments: todayCount,
      weekAppointments: weekCount
    });
    
    // Update revenue data as well
    getRevenueData();
  }, [getRevenueData]);
  
  // Call getRevenueData on initial render
  useEffect(() => {
    if (confirmedAppointments.length > 0) {
      getRevenueData();
    }
  }, [confirmedAppointments, getRevenueData]);

  return {
    isLoading: isLoading || loading,
    error,
    todayStats,
    weekStats,
    monthStats,
    projectedRevenue,
    availableTimeSlots,
    averageClientValue,
    avgClientsPerDay,
    monthlyAppointmentsCount,
    dashboardStats,
    revenueData,
    calculateNetProfit,
    calculatedMonthlyRevenue,
    getRevenueData,
    updateDashboardStats
  };
}
