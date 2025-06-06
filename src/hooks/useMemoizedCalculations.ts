
import { useMemo } from 'react';
import { Appointment, Service, Client, Expense } from '@/types';
import { startOfMonth, endOfMonth, isWithinInterval, isFuture, isToday } from 'date-fns';
import { normalizeDateNoon } from '@/lib/dateUtils';

interface UseMemoizedCalculationsProps {
  appointments: Appointment[];
  services: Service[];
  clients: Client[];
  expenses: Expense[];
  selectedMonth?: number;
  selectedYear?: number;
}

export const useMemoizedCalculations = ({
  appointments,
  services,
  clients,
  expenses,
  selectedMonth,
  selectedYear
}: UseMemoizedCalculationsProps) => {
  
  // Memoized filtered appointments by status
  const confirmedAppointments = useMemo(() => 
    appointments.filter(app => app.status === "confirmed"),
    [appointments]
  );

  // Memoized monthly revenue calculation
  const monthlyRevenue = useMemo(() => {
    if (selectedMonth === undefined || selectedYear === undefined) {
      return 0;
    }
    
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const monthEnd = endOfMonth(monthStart);
    
    return confirmedAppointments
      .filter(appointment => {
        const appointmentDate = normalizeDateNoon(new Date(appointment.date));
        return isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, appointment) => sum + appointment.price, 0);
  }, [confirmedAppointments, selectedMonth, selectedYear]);

  // Memoized projected revenue calculation
  const projectedRevenue = useMemo(() => {
    const now = new Date();
    const currentMonth = selectedMonth ?? now.getMonth();
    const currentYear = selectedYear ?? now.getFullYear();
    const monthEnd = endOfMonth(new Date(currentYear, currentMonth));
    
    return confirmedAppointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return (isFuture(appointmentDate) || isToday(appointmentDate)) && 
               appointmentDate <= monthEnd;
      })
      .reduce((sum, appointment) => sum + appointment.price, 0);
  }, [confirmedAppointments, selectedMonth, selectedYear]);

  // Memoized service revenue calculations
  const serviceRevenue = useMemo(() => {
    const serviceMap = new Map<string, { name: string; revenue: number; count: number }>();
    
    confirmedAppointments.forEach(appointment => {
      if (!appointment.serviceId || !appointment.service) return;
      
      const serviceId = appointment.serviceId;
      const serviceName = appointment.service.name;
      
      if (serviceMap.has(serviceId)) {
        const existing = serviceMap.get(serviceId)!;
        existing.revenue += appointment.price;
        existing.count += 1;
      } else {
        serviceMap.set(serviceId, {
          name: serviceName,
          revenue: appointment.price,
          count: 1
        });
      }
    });
    
    return Array.from(serviceMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [confirmedAppointments]);

  // Memoized top clients calculation
  const topClients = useMemo(() => {
    return [...clients]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 5);
  }, [clients]);

  // Memoized monthly expenses calculation
  const monthlyExpenses = useMemo(() => {
    if (selectedMonth === undefined || selectedYear === undefined) {
      return 0;
    }
    
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const monthEnd = endOfMonth(monthStart);
    
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, selectedMonth, selectedYear]);

  // Memoized net profit calculation
  const netProfit = useMemo(() => {
    return monthlyRevenue - monthlyExpenses;
  }, [monthlyRevenue, monthlyExpenses]);

  return {
    confirmedAppointments,
    monthlyRevenue,
    projectedRevenue,
    serviceRevenue,
    topClients,
    monthlyExpenses,
    netProfit
  };
};
