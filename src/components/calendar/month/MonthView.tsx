
import React, { useState, useCallback, useMemo } from 'react';
import { useData } from '@/context/DataProvider';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, getDay, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayCell } from './DayCell';
import { createDateWithNoon, normalizeDateNoon } from '@/lib/dateUtils';

interface MonthViewProps {
  date: Date;
  onDaySelect: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  date,
  onDaySelect
}) => {
  const normalizedDate = normalizeDateNoon(date);
  const [currentMonth, setCurrentMonth] = useState<Date>(normalizedDate);
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
    if (!day || !appointments || !blockedDates) return {
      appointmentsCount: 0,
      blocksCount: 0,
      occupancyPercentage: 0,
      isFullDayBlocked: false
    };

    // Normalize the input day to noon
    const normalizedDay = normalizeDateNoon(day);

    // Use isSameDay for more reliable date comparison
    const dayAppointments = appointments.filter(appt => 
      appt && isSameDay(normalizeDateNoon(new Date(appt.date)), normalizedDay) && appt.status !== 'canceled'
    );
    const dayBlocks = blockedDates.filter(block => 
      block && isSameDay(normalizeDateNoon(new Date(block.date)), normalizedDay)
    );
    const isFullDayBlocked = dayBlocks.some(block => block.allDay);

    // Calculate occupied minutes
    let occupiedMinutes = isFullDayBlocked ? totalBusinessMinutes : 0;

    if (!isFullDayBlocked) {
      dayAppointments.forEach(appt => {
        if (appt.endTime) {
          const startTime = new Date(appt.date);
          const endTime = new Date(appt.endTime);
          const apptStartHour = Math.max(startTime.getHours(), businessStartHour);
          const apptEndHour = Math.min(endTime.getHours(), businessEndHour);
          const apptStartMinutes = startTime.getHours() === apptStartHour ? startTime.getMinutes() : 0;
          const apptEndMinutes = endTime.getHours() === apptEndHour ? endTime.getMinutes() : 0;
          
          occupiedMinutes += (apptEndHour - apptStartHour) * 60 + apptEndMinutes - apptStartMinutes;
        } else if (appt.service?.durationMinutes) {
          occupiedMinutes += appt.service.durationMinutes;
        } else {
          // Default to 1 hour if no duration specified
          occupiedMinutes += 60;
        }
      });
    }
    
    // Calculate occupancy percentage (0-100)
    const occupancyPercentage = Math.min(Math.round((occupiedMinutes / totalBusinessMinutes) * 100), 100);
    
    return {
      appointmentsCount: dayAppointments.length,
      blocksCount: dayBlocks.length,
      occupancyPercentage,
      isFullDayBlocked
    };
  }, [appointments, blockedDates, totalBusinessMinutes, businessStartHour, businessEndHour]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      const newDate = addMonths(prevMonth, -1);
      return createDateWithNoon(newDate.getFullYear(), newDate.getMonth(), 1);
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      const newDate = addMonths(prevMonth, 1);
      return createDateWithNoon(newDate.getFullYear(), newDate.getMonth(), 1);
    });
  }, []);

  const handleDayClick = useCallback((day: Date) => {
    // Set localStorage to remember day view preference
    localStorage.setItem('calendarViewMode', 'day');
    
    // Use normalizeDateNoon to ensure consistent noon time for all date operations
    const normalizedDay = normalizeDateNoon(day);
    onDaySelect(normalizedDay);
  }, [onDaySelect]);

  return (
    <div className="month-view-container p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {format(monthStart, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Mês anterior</span>
          </Button>
          <Button variant="outline" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Próximo mês</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Day names header */}
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
          <div key={day} className="text-center py-2 text-sm font-medium">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {daysToDisplay.map((day, index) => {
          if (!day) return <div key={index} className="p-2 border rounded-md bg-gray-50" />;
          
          const isCurrentMonth = isSameMonth(day, monthStart);
          const dayStats = getDayStats(day);
          
          return (
            <DayCell
              key={index}
              day={day}
              isCurrentMonth={isCurrentMonth}
              dayStats={dayStats}
              onClick={handleDayClick}
            />
          );
        })}
      </div>
    </div>
  );
}
