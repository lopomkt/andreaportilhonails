
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/context/DataProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { createDateWithNoon } from '@/lib/dateUtils';

interface ReportsFinanceSectionProps {
  selectedMonth: number;
  selectedYear: number;
}

export function ReportsFinanceSection({ selectedMonth, selectedYear }: ReportsFinanceSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => createDateWithNoon(selectedYear, selectedMonth));
  const { appointments } = useData();
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [previousMonthRevenue, setPreviousMonthRevenue] = useState<number>(0);

  // Use useMemo to optimize filtering of appointments
  const filteredAppointmentsByMonth = useMemo(() => {
    const monthStart = startOfMonth(createDateWithNoon(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(monthStart);

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
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
    const monthStart = startOfMonth(createDateWithNoon(selectedYear, selectedMonth));
    const previousMonth = subMonths(monthStart, 1);
    const previousMonthStart = startOfMonth(previousMonth);
    const previousMonthEnd = endOfMonth(previousMonth);

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return (
        isWithinInterval(appointmentDate, {
          start: previousMonthStart,
          end: previousMonthEnd
        }) &&
        appointment.status === 'confirmed'
      );
    });
  }, [appointments, selectedMonth, selectedYear]);

  useEffect(() => {
    // Update the selectedDate when the props change
    setSelectedDate(createDateWithNoon(selectedYear, selectedMonth));
    
    // Calculate current month revenue
    const totalRevenue = filteredAppointmentsByMonth.reduce((sum, appointment) => sum + appointment.price, 0);
    setMonthlyRevenue(totalRevenue);

    // Calculate previous month revenue
    const previousMonthTotalRevenue = previousMonthFilteredAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    setPreviousMonthRevenue(previousMonthTotalRevenue);
  }, [selectedMonth, selectedYear, filteredAppointmentsByMonth, previousMonthFilteredAppointments]);

  const handleMonthChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const getRevenueData = useMemo(() => {
    // Create a new Date object using selectedYear instead of calling getFullYear() on selectedMonth
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(selectedYear, i, 1);
      return format(monthDate, 'MMMM', { locale: ptBR });
    });

    return months.map((month, index) => {
      const monthStart = startOfMonth(createDateWithNoon(selectedYear, index));
      const monthEnd = endOfMonth(monthStart);
      
      const filteredAppts = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return (
          isWithinInterval(appointmentDate, {
            start: monthStart,
            end: monthEnd
          }) &&
          appointment.status === 'confirmed'
        );
      });
      
      const totalRevenue = filteredAppts.reduce((sum, appointment) => sum + appointment.price, 0);

      return {
        date: format(monthStart, 'yyyy-MM-dd'),
        revenue: totalRevenue,
      };
    });
  }, [appointments, selectedYear]);

  return (
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
              locale={ptBR}
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
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
          }).format(monthlyRevenue)}
        </div>
        <p className="text-sm text-muted-foreground">
          Receita do mês atual em comparação com{' '}
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(previousMonthRevenue)} do mês anterior.
        </p>
      </CardContent>
    </Card>
  );
}
