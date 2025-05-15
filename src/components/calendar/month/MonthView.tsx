import React, { useState, useCallback } from 'react';
import { useData } from '@/context/DataProvider';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, getDay, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayCell } from './DayCell';

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
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });
  
  const startWeekday = getDay(monthStart);
  const daysToDisplay = [
    ...Array(startWeekday).fill(null).map((_, i) => addDays(monthStart, i - startWeekday)), 
    ...monthDays
  ];
  
  while (daysToDisplay.length < 42) {
    daysToDisplay.push(addDays(daysToDisplay[daysToDisplay.length - 1], 1));
  }

  // Business hours configuration
  const businessStartHour = 7;
  const businessEndHour = 19;
  const totalBusinessMinutes = (businessEndHour - businessStartHour) * 60;
  
  const getDayStats = (day: Date) => {
    if (!day) return {
      appointmentsCount: 0,
      blocksCount: 0,
      occupancyPercentage: 0,
      isFullDayBlocked: false
    };

    const dayAppointments = appointments.filter(appt => 
      isSameDay(new Date(appt.date), day) && appt.status !== 'canceled'
    );
    const dayBlocks = blockedDates.filter(block => 
      isSameDay(new Date(block.date), day)
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
  };
  
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Fixed month navigation functions using addMonths instead of addDays
  const goToPreviousMonth = () => setCurrentMonth(prev => addMonths(prev, -1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  // Fixed handler for day click with correct date handling
  const handleDayClick = useCallback((day: Date | null) => {
    if (day && isSameMonth(day, currentMonth)) {
      // Set calendar view mode to day
      localStorage.setItem('calendarViewMode', 'day');
      
      // Create normalized date with noon time to avoid timezone issues
      const selectedDate = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        12, 0, 0, 0  // Set to noon (12:00) to avoid timezone issues
      );
      
      console.log("Day clicked, redirecting to day view with date:", selectedDate);
      
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
