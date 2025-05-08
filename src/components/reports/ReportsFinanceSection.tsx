
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils";

interface ReportsFinanceSectionProps {
  selectedMonth: number;
  selectedYear: number;
}

export function ReportsFinanceSection({ selectedMonth, selectedYear }: ReportsFinanceSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(selectedYear, selectedMonth, 1));
  const { appointments } = useData();
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [previousMonthRevenue, setPreviousMonthRevenue] = useState<number>(0);

  const filterAppointmentsByMonth = (monthStart: Date, monthEnd: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate >= monthStart &&
        appointmentDate <= monthEnd &&
        appointment.status === 'confirmed'
      );
    });
  };

  useEffect(() => {
    // Update the selectedDate when the props change
    setSelectedDate(new Date(selectedYear, selectedMonth, 1));
    
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));
    const filteredAppointments = filterAppointmentsByMonth(monthStart, monthEnd);
    const totalRevenue = filteredAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    setMonthlyRevenue(totalRevenue);

    const previousMonth = subMonths(monthStart, 1);
    const previousMonthStart = startOfMonth(previousMonth);
    const previousMonthEnd = endOfMonth(previousMonth);
    const previousMonthFilteredAppointments = filterAppointmentsByMonth(previousMonthStart, previousMonthEnd);
    const previousMonthTotalRevenue = previousMonthFilteredAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
    setPreviousMonthRevenue(previousMonthTotalRevenue);
  }, [selectedMonth, selectedYear, appointments]);

  const handleMonthChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const getRevenueData = () => {
    // Create a new Date object using selectedYear instead of calling getFullYear() on selectedMonth
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(selectedYear, i, 1);
      return format(monthDate, 'MMMM', { locale: ptBR });
    });

    const revenueData = months.map((month, index) => {
      const monthStart = startOfMonth(new Date(selectedYear, index, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, index, 1));
      const filteredAppointments = filterAppointmentsByMonth(monthStart, monthEnd);
      const totalRevenue = filteredAppointments.reduce((sum, appointment) => sum + appointment.price, 0);

      // Ensure dateStr is always a string
      const processDateString = (dateValue: string | Date): string => {
        if (dateValue instanceof Date) {
          return format(dateValue, 'yyyy-MM-dd');
        }
        return dateValue;
      };

      return {
        date: processDateString(monthStart),
        revenue: totalRevenue,
      };
    });

    return revenueData;
  };

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
