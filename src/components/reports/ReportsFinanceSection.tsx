
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createDateWithNoon, normalizeDateNoon, isTodayOrFuture, getConfirmedFutureAppointments } from '@/lib/dateUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportsFinanceSectionProps {
  selectedMonth: number;
  selectedYear: number;
}

export function ReportsFinanceSection({ selectedMonth, selectedYear }: ReportsFinanceSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => createDateWithNoon(selectedYear, selectedMonth));
  const { appointments, expenses } = useData();
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [previousMonthRevenue, setPreviousMonthRevenue] = useState<number>(0);
  const [expectedRevenue, setExpectedRevenue] = useState<number>(0);
  const [netProfit, setNetProfit] = useState<number>(0);

  // Use useMemo to optimize filtering of appointments
  const filteredAppointmentsByMonth = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    const monthStart = startOfMonth(createDateWithNoon(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(monthStart);

    return appointments.filter(appointment => {
      if (!appointment) return false;
      
      const appointmentDate = normalizeDateNoon(new Date(appointment.date));
      return (
        isWithinInterval(appointmentDate, {
          start: monthStart,
          end: monthEnd
        }) &&
        appointment.status === 'confirmed'
      );
    });
  }, [appointments, selectedMonth, selectedYear]);

  // Use useMemo for previous month appointments
  const previousMonthFilteredAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    const monthStart = startOfMonth(createDateWithNoon(selectedYear, selectedMonth));
    const previousMonth = subMonths(monthStart, 1);
    const previousMonthStart = startOfMonth(previousMonth);
    const previousMonthEnd = endOfMonth(previousMonth);

    return appointments.filter(appointment => {
      if (!appointment) return false;
      
      const appointmentDate = normalizeDateNoon(new Date(appointment.date));
      return (
        isWithinInterval(appointmentDate, {
          start: previousMonthStart,
          end: previousMonthEnd
        }) &&
        appointment.status === 'confirmed'
      );
    });
  }, [appointments, selectedMonth, selectedYear]);

  // Use useMemo for expected future revenue in current month
  const calculatedExpectedRevenue = useMemo(() => {
    if (!appointments || appointments.length === 0) return 0;
    
    const monthStart = startOfMonth(createDateWithNoon(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(monthStart);
    
    // Only count future confirmed appointments within this month
    return appointments
      .filter(appointment => {
        if (!appointment) return false;
        
        const appointmentDate = new Date(appointment.date);
        return (
          isTodayOrFuture(appointmentDate) &&
          isWithinInterval(normalizeDateNoon(appointmentDate), { 
            start: monthStart, 
            end: monthEnd 
          }) &&
          appointment.status === 'confirmed'
        );
      })
      .reduce((sum, appointment) => sum + (appointment.price || 0), 0);
  }, [appointments, selectedMonth, selectedYear]);
  
  // Use useMemo for filtered expenses in current month
  const filteredMonthlyExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    const monthStart = startOfMonth(createDateWithNoon(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(monthStart);
    
    return expenses.filter(expense => {
      if (!expense) return false;
      
      const expenseDate = normalizeDateNoon(new Date(expense.date));
      return isWithinInterval(expenseDate, {
        start: monthStart,
        end: monthEnd
      });
    });
  }, [expenses, selectedMonth, selectedYear]);
  
  // Calculate monthly total expenses
  const monthlyExpensesTotal = useMemo(() => {
    if (!filteredMonthlyExpenses || filteredMonthlyExpenses.length === 0) return 0;
    return filteredMonthlyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [filteredMonthlyExpenses]);
  
  // Calculate net profit
  const calculatedNetProfit = useMemo(() => {
    const revenue = monthlyRevenue || 0;
    const expenses = monthlyExpensesTotal || 0;
    return revenue - expenses;
  }, [monthlyRevenue, monthlyExpensesTotal]);

  useEffect(() => {
    // Update the selectedDate when the props change
    setSelectedDate(createDateWithNoon(selectedYear, selectedMonth));
    
    // Calculate current month revenue
    const totalRevenue = filteredAppointmentsByMonth.reduce((sum, appointment) => sum + (appointment.price || 0), 0);
    setMonthlyRevenue(totalRevenue);

    // Calculate previous month revenue
    const previousMonthTotalRevenue = previousMonthFilteredAppointments.reduce((sum, appointment) => sum + (appointment.price || 0), 0);
    setPreviousMonthRevenue(previousMonthTotalRevenue);
    
    // Set expected revenue
    setExpectedRevenue(calculatedExpectedRevenue);
    
    // Set net profit
    setNetProfit(calculatedNetProfit);
  }, [selectedMonth, selectedYear, filteredAppointmentsByMonth, previousMonthFilteredAppointments, calculatedExpectedRevenue, calculatedNetProfit]);

  const handleMonthChange = useCallback((date: Date | undefined) => {
    if (date) {
      const normalizedDate = normalizeDateNoon(date);
      setSelectedDate(normalizedDate);
    }
  }, []);

  // Revenue and Expenses data for the year bar chart
  const yearlyFinanceData = useMemo(() => {
    if (!appointments || appointments.length === 0 || !expenses) {
      return Array.from({ length: 12 }, (_, monthIndex) => {
        const monthName = format(new Date(selectedYear, monthIndex, 1), 'MMM', { locale: ptBR });
        return {
          name: monthName,
          receita: 0,
          despesas: 0,
          lucro: 0
        };
      });
    }
    
    const currentYear = selectedYear;
    
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = startOfMonth(createDateWithNoon(currentYear, monthIndex));
      const monthEnd = endOfMonth(monthStart);
      
      const monthRevenue = appointments
        .filter(appointment => {
          if (!appointment) return false;
          
          const appointmentDate = normalizeDateNoon(new Date(appointment.date));
          return (
            isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd }) &&
            appointment.status === 'confirmed'
          );
        })
        .reduce((sum, appointment) => sum + (appointment.price || 0), 0);
        
      const monthExpenses = expenses
        .filter(expense => {
          if (!expense) return false;
          
          const expenseDate = normalizeDateNoon(new Date(expense.date));
          return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, expense) => sum + (expense.amount || 0), 0);
      
      const monthName = format(monthStart, 'MMM', { locale: ptBR });
      
      return {
        name: monthName,
        receita: monthRevenue,
        despesas: monthExpenses,
        lucro: monthRevenue - monthExpenses
      };
    });
  }, [appointments, expenses, selectedYear]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "MMMM yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecionar mês</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleMonthChange}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(monthlyRevenue || 0)}
            </div>
            <p className="text-sm text-muted-foreground">
              Receita do mês atual em comparação com{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(previousMonthRevenue || 0)} do mês anterior.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Prevista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(expectedRevenue || 0)}
            </div>
            <p className="text-sm text-muted-foreground">
              Receita prevista de agendamentos confirmados até o final do mês.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(netProfit || 0)}
            </div>
            <p className="text-sm text-muted-foreground">
              Total de receitas (R$ {(monthlyRevenue || 0).toLocaleString('pt-BR')}) menos despesas 
              (R$ {(monthlyExpensesTotal || 0).toLocaleString('pt-BR')}) do mês.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Receita e Despesas Mensais ({selectedYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={yearlyFinanceData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  style: 'currency',
                  currency: 'BRL'
                }).format(value)} 
              />
              <Tooltip 
                formatter={(value) => new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(Number(value))}
              />
              <Legend />
              <Bar dataKey="receita" name="Receita" fill="#0088FE" />
              <Bar dataKey="despesas" name="Despesas" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
