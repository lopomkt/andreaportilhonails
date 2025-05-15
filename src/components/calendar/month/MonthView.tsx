
import React, { useState, useCallback, useMemo } from 'react';
import { useData } from '@/context/DataProvider';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, getDay, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayCell } from './DayCell';
import { createDateWithNoon } from '@/lib/dateUtils';

interface MonthViewProps {
  date: Date;
  onDaySelect: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  date,
  onDaySelect
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(date);
  const { appointments, blockedDates } = useData();
  
  // Always use noon (12:00) for month start and end
  const monthStart = useMemo(() => createDateWithNoon(currentMonth.getFullYear(), currentMonth.getMonth(), 1), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  
  // Calculate all days to display in the month grid
  const daysToDisplay = useMemo(() => {
    const monthDays = eachDayOfInterval({
      start: monthStart,
      end: monthEnd
    }).map(day => createDateWithNoon(day.getFullYear(), day.getMonth(), day.getDate()));
    
    const startWeekday = getDay(monthStart);
    const result = [
      ...Array(startWeekday).fill(null).map((_, i) => {
        const prevMonthDay = addDays(monthStart, i - startWeekday);
        return createDateWithNoon(prevMonthDay.getFullYear(), prevMonthDay.getMonth(), prevMonthDay.getDate());
      }), 
      ...monthDays
    ];
    
    // Fill remaining cells in the grid, ensuring noon time
    while (result.length < 42) {
      const lastDay = result[result.length - 1];
      const nextDay = lastDay ? addDays(lastDay, 1) : addDays(monthEnd, 1);
      // Set time to noon
      const normalizedNextDay = createDateWithNoon(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());
      result.push(normalizedNextDay);
    }
    
    return result;
  }, [monthStart, monthEnd]);

  // Business hours configuration
  const businessStartHour = 7;
  const businessEndHour = 19;
  const totalBusinessMinutes = (businessEndHour - businessStartHour) * 60;
  
  const getDayStats = useCallback((day: Date) => {
    if (!day) return {
      appointmentsCount: 0,
      blocksCount: 0,
      occupancyPercentage: 0,
      isFullDayBlocked: false
    };

    // Use isSameDay for more reliable date comparison
    const dayAppointments = appointments.filter(appt => 
      appt && isSameDay(new Date(appt.date), day) && appt.status !== 'canceled'
    );
    const dayBlocks = blockedDates.filter(block => 
      block && isSameDay(new Date(block.date), day)
    );
    const isFullDayBlocked = dayBlocks.some(block => block.allDay);

    // Calculate occupied minutes
    let occupiedMinutes = isFullDayBlocked ? totalBusinessMinutes : 0;

    if (!isFullDayBlocked) {
      dayAppointments.forEach(appt => {
        if (appt.endTime) {
          const startTime = new Date(appt.date);
          const endTime = new Date(appt.endTime);
          const apptStartHour = startTime.getHours();
          const apptEndHour = endTime.getHours();
          const apptEndMinutes = endTime.getMinutes();

          const effectiveStartHour = Math.max(apptStartHour, businessStartHour);
          const effectiveEndHour = Math.min(apptEndHour + (apptEndMinutes > 0 ? 1 : 0), businessEndHour);
          
          if (effectiveEndHour > effectiveStartHour) {
            occupiedMinutes += (effectiveEndHour - effectiveStartHour) * 60;
            if (apptStartHour >= businessStartHour && apptStartHour < businessEndHour) {
              occupiedMinutes -= startTime.getMinutes();
            }
            if (apptEndHour >= businessStartHour && apptEndHour < businessEndHour) {
              occupiedMinutes -= (60 - apptEndMinutes) % 60;
            }
          }
        }
      });
    }

    const occupancyPercentage = Math.min(Math.round(occupiedMinutes / totalBusinessMinutes * 100), 100);
    
    return {
      appointmentsCount: dayAppointments.length,
      blocksCount: dayBlocks.length,
      occupancyPercentage,
      isFullDayBlocked
    };
  }, [appointments, blockedDates]);
  
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Fixed month navigation functions using addMonths with noon time
  const goToPreviousMonth = useCallback(() => {
    const prevMonth = addMonths(currentMonth, -1);
    // Create new date with noon time
    const normalizedDate = createDateWithNoon(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
    setCurrentMonth(normalizedDate);
  }, [currentMonth]);
  
  const goToNextMonth = useCallback(() => {
    const nextMonth = addMonths(currentMonth, 1);
    // Create new date with noon time
    const normalizedDate = createDateWithNoon(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    setCurrentMonth(normalizedDate);
  }, [currentMonth]);

  // Fixed handler for day click with correct date handling and noon time
  const handleDayClick = useCallback((day: Date | null) => {
    if (day && isSameMonth(day, currentMonth)) {
      // Set calendar view mode to day
      localStorage.setItem('calendarViewMode', 'day');
      
      // Create normalized date with noon time to avoid timezone issues
      const selectedDate = createDateWithNoon(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );
      
      // Call the onDaySelect with the normalized date
      onDaySelect(selectedDate);
    }
  }, [onDaySelect, currentMonth]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold md:text-2xl text-lg">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-8 w-8 border-rose-200">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8 border-rose-200">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center py-2 text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {daysToDisplay.map((day, index) => {
          const isCurrentMonthDay = day ? isSameMonth(day, currentMonth) : false;
          const stats = getDayStats(day);
          
          return (
            <DayCell
              key={day ? day.toISOString() : `empty-${index}`}
              day={day}
              isCurrentMonth={isCurrentMonthDay}
              appointmentsCount={stats.appointmentsCount}
              blocksCount={stats.blocksCount}
              occupancyPercentage={stats.occupancyPercentage}
              isFullDayBlocked={stats.isFullDayBlocked}
              onClick={() => day && isCurrentMonthDay && handleDayClick(day)}
            />
          );
        })}
      </div>
      
      <div className="text-xs text-gray-500 mt-4">
        {appointments.length > 0 ? (
          <p>Analise os agendamentos e bloqueios por cada data do mês selecionado.</p>
        ) : (
          <p>Nenhum agendamento encontrado para esta data.</p>
        )}
      </div>
    </div>
  );
};
