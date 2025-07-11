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
import { normalizeDate, calculateDurationInMinutes } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';

export function useDashboardStats(month?: number, year?: number) {
  const { toast } = useToast();
  const { appointments, fetchAppointments, error, loading } = useAppointments();
  const { clients, blockedDates, expenses } = useData();
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

  // Use custom month/year for filtering if provided
  const filterDate = useMemo(() => {
    if (month !== undefined && year !== undefined) {
      return new Date(year, month, 1);
    }
    return new Date();
  }, [month, year]);

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

  // This month's stats - using filterDate for custom month/year filtering
  const monthStats = useMemo(() => {
    const startDate = startOfMonth(filterDate);
    const endDate = endOfMonth(filterDate);
    
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
  }, [confirmedAppointments, filterDate]);

  // Projected future revenue - CORRECTED CALCULATION
  const projectedRevenue = useMemo(() => {
    const now = new Date();
    
    // Use filterDate for month/year if provided, otherwise use current
    const targetDate = month !== undefined && year !== undefined 
      ? new Date(year, month, 1) 
      : new Date();
    
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    
    // Filter for confirmed appointments from today (or month start if future month) until end of target month
    const futureAppointments = confirmedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      
      // If filtering for current month, start from today
      // If filtering for future month, start from beginning of that month
      const startFilter = month !== undefined && year !== undefined 
        ? (targetDate > now ? monthStart : now)
        : now;
      
      return (
        appointmentDate >= startFilter &&
        appointmentDate <= monthEnd
      );
    });
    
    // Sum prices of future confirmed appointments
    return futureAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
  }, [confirmedAppointments, month, year]);

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
  
  // Monthly revenue count
  const monthlyAppointmentsCount = useMemo(() => {
    return monthStats.count;
  }, [monthStats]);

  // Service time statistics - calculate average duration for each service
  const serviceTimeStats = useMemo(() => {
    const serviceMap = new Map();
    
    confirmedAppointments.forEach(appointment => {
      if (!appointment.serviceId || !appointment.service) return;
      
      const serviceId = appointment.serviceId;
      const serviceName = appointment.service.name;
      const serviceScheduledTime = appointment.service.durationMinutes || 60;
      
      // Calculate actual duration if end time is available
      let actualDuration = serviceScheduledTime;
      if (appointment.endTime) {
        const startDate = new Date(appointment.date);
        const endDate = new Date(appointment.endTime);
        actualDuration = calculateDurationInMinutes(startDate, endDate);
      }
      
      if (!serviceMap.has(serviceId)) {
        serviceMap.set(serviceId, {
          serviceId,
          serviceName,
          durations: [],
          scheduledTime: serviceScheduledTime
        });
      }
      
      serviceMap.get(serviceId).durations.push(actualDuration);
    });
    
    // Calculate averages
    return Array.from(serviceMap.values()).map(service => {
      const averageTime = service.durations.length > 0 
        ? service.durations.reduce((sum, duration) => sum + duration, 0) / service.durations.length
        : service.scheduledTime;
        
      return {
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        averageTime: Math.round(averageTime),
        scheduledTime: service.scheduledTime,
        appointmentCount: service.durations.length
      };
    }).sort((a, b) => b.appointmentCount - a.appointmentCount);
  }, [confirmedAppointments]);
  
  // Update dashboard stats based on calculated values
  useEffect(() => {
    setDashboardStats({
      monthRevenue: monthStats.revenue,
      newClients: 0, // Would need to calculate this based on client creation dates
      totalAppointments: confirmedAppointments.length,
      inactiveClients: 0, // Would need to calculate this based on client activity
      todayAppointments: todayStats.count,
      weekAppointments: weekStats.count
    });
  }, [confirmedAppointments.length, todayStats.count, weekStats.count, monthStats.revenue]);
  
  // Get revenue data for charts with useCallback
  const getRevenueData = useCallback(() => {
    const currentYear = filterDate.getFullYear();
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
  }, [confirmedAppointments, filterDate]);
  
  // Calculate monthly revenue for specific month/year with useCallback
  const calculatedMonthlyRevenue = useCallback((appointments: Appointment[], month?: number, year?: number) => {
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
  }, []);

  // Calculate net profit with useCallback
  const calculateNetProfit = useCallback(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return monthStats.revenue - totalExpenses;
  }, [monthStats.revenue, expenses]);
  
  // Calculate expected revenue (future confirmed appointments)
  const calculateExpectedRevenue = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthEnd = endOfMonth(new Date(currentYear, currentMonth));
    
    return confirmedAppointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return (isFuture(appointmentDate) || isToday(appointmentDate)) && appointmentDate <= monthEnd;
      })
      .reduce((sum, appointment) => sum + appointment.price, 0);
  }, [confirmedAppointments]);

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
      newClients: 0,
      totalAppointments: currentAppointments.length,
      inactiveClients: 0,
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
    updateDashboardStats,
    serviceTimeStats,
    calculateExpectedRevenue,
    // New methods for financial reporting
    getMonthlyRevenue: () => monthStats.revenue,
    getExpectedRevenue: calculateExpectedRevenue,
    getNetProfit: calculateNetProfit,
    getTotalExpenses: () => expenses.reduce((sum, expense) => sum + expense.amount, 0)
  };
}
