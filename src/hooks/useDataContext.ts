
import { useContext } from 'react';
import { DataContext } from '@/context/DataContext';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

/**
 * Custom hook to safely access DataContext
 * This ensures proper error handling when the context is used outside its provider
 */
export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

/**
 * Custom hook for dashboard data and calculations
 */
export const useDashboardContext = (month?: number, year?: number) => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DataProvider');
  }
  
  const { appointments, expenses } = context;
  
  // Filter appointments by selected month/year
  const filteredAppointments = (() => {
    if (month === undefined || year === undefined) {
      return appointments;
    }
    
    const startDate = startOfMonth(new Date(year, month, 1));
    const endDate = endOfMonth(startDate);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, { start: startDate, end: endDate });
    });
  })();
  
  const confirmedAppointments = filteredAppointments.filter(app => app.status === "confirmed");
  
  // Calculate monthly revenue for confirmed appointments
  const confirmedRevenue = confirmedAppointments.reduce((sum, app) => sum + app.price, 0);
  
  // Calculate future revenue (expected)
  const expectedRevenue = confirmedAppointments
    .filter(app => new Date(app.date) > new Date())
    .reduce((sum, app) => sum + app.price, 0);
  
  // Calculate total expenses for the period
  const totalExpenses = expenses.reduce((sum, expense) => {
    if (month === undefined || year === undefined) {
      return sum + expense.amount;
    }
    
    const expenseDate = new Date(expense.date);
    const startDate = startOfMonth(new Date(year, month, 1));
    const endDate = endOfMonth(startDate);
    
    if (isWithinInterval(expenseDate, { start: startDate, end: endDate })) {
      return sum + expense.amount;
    }
    
    return sum;
  }, 0);
  
  // Calculate net profit
  const netProfit = confirmedRevenue - totalExpenses;
  
  return {
    ...context,
    filteredAppointments,
    confirmedAppointments,
    confirmedRevenue,
    expectedRevenue,
    totalExpenses,
    netProfit
  };
};
