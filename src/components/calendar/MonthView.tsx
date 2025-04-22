
import React, { useState } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addDays, getDay, differenceInMinutes, parseISO, set, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Calendar, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthViewProps {
  date: Date;
  onDaySelect: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  date,
  onDaySelect
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(date);
  const {
    appointments,
    blockedDates
  } = useSupabaseData();
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });
  
  const startWeekday = getDay(monthStart);
  const daysToDisplay = [...Array(startWeekday).fill(null).map((_, i) => addDays(monthStart, i - startWeekday)), ...monthDays];
  
  while (daysToDisplay.length < 42) {
    daysToDisplay.push(addDays(daysToDisplay[daysToDisplay.length - 1], 1));
  }

  // Define business hours (7:00 to 19:00)
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

    // Filter active appointments (not canceled)
    const dayAppointments = appointments.filter(appt => isSameDay(new Date(appt.date), day) && appt.status !== 'canceled');

    // Get blocks for this day
    const dayBlocks = blockedDates.filter(block => isSameDay(new Date(block.date), day));

    // Check if full day is blocked
    const isFullDayBlocked = dayBlocks.some(block => block.allDay);

    // Calculate occupied minutes
    let occupiedMinutes = 0;

    // Add appointment durations
    dayAppointments.forEach(appt => {
      if (appt.endTime) {
        const startTime = new Date(appt.date);
        const endTime = new Date(appt.endTime);

        // Only count minutes that fall within business hours
        const apptStartHour = startTime.getHours();
        const apptEndHour = endTime.getHours();
        const apptEndMinutes = endTime.getMinutes();

        // Calculate actual business hours overlap
        const effectiveStartHour = Math.max(apptStartHour, businessStartHour);
        const effectiveEndHour = Math.min(apptEndHour + (apptEndMinutes > 0 ? 1 : 0), businessEndHour);
        if (effectiveEndHour > effectiveStartHour) {
          occupiedMinutes += (effectiveEndHour - effectiveStartHour) * 60;

          // Adjust for partial hours
          if (apptStartHour >= businessStartHour && apptStartHour < businessEndHour) {
            occupiedMinutes -= startTime.getMinutes();
          }
          if (apptEndHour >= businessStartHour && apptEndHour < businessEndHour) {
            occupiedMinutes -= (60 - apptEndMinutes) % 60;
          }
        }
      }
    });

    // Add blocked time
    dayBlocks.forEach(block => {
      if (block.allDay) {
        // Full day block takes the entire business hours
        occupiedMinutes = totalBusinessMinutes;
      }
      // For partial blocks, would need start/end time to calculate
    });

    // Calculate occupancy percentage
    const occupancyPercentage = Math.min(Math.round(occupiedMinutes / totalBusinessMinutes * 100), 100);
    return {
      appointmentsCount: dayAppointments.length,
      blocksCount: dayBlocks.length,
      occupancyPercentage,
      isFullDayBlocked
    };
  };
  
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Handle day click - Fixed to preserve exact date when clicked
  const handleDayClick = (day: Date) => {
    if (day) {
      // Create a new Date object with the exact same day that was clicked
      // This fixes the issue where clicking on day 21 was selecting day 20
      const selectedDate = new Date(day);
      onDaySelect(selectedDate);
    }
  };

  return <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold md:text-2xl text-lg">
          {format(currentMonth, 'MMMM yyyy', {
            locale: ptBR
          })}
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
        {weekDays.map(day => <div key={day} className="text-center py-2 text-sm font-medium text-muted-foreground">
            {day}
          </div>)}
        
        {daysToDisplay.map((day, index) => {
        if (!day) return <div key={`empty-${index}`} className="aspect-square" />;
        const {
          appointmentsCount,
          blocksCount,
          occupancyPercentage,
          isFullDayBlocked
        } = getDayStats(day);
        const isCurrentMonth = isSameMonth(day, currentMonth);
        const isCurrentDay = isToday(day);

        // Determine occupancy color based on percentage
        let occupancyColor = "bg-blue-500";
        if (occupancyPercentage >= 75) {
          occupancyColor = "bg-blue-600";
        } else if (occupancyPercentage >= 50) {
          occupancyColor = "bg-blue-500";
        } else if (occupancyPercentage >= 25) {
          occupancyColor = "bg-blue-400";
        } else if (occupancyPercentage > 0) {
          occupancyColor = "bg-blue-300";
        }
        return <div 
                key={day.toISOString()} 
                className={cn(
                  "aspect-square border rounded-full p-1 relative cursor-pointer transition-colors", 
                  isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground", 
                  isCurrentDay && "border-rose-500", 
                  isFullDayBlocked && "bg-gray-50", 
                  "hover:border-rose-300"
                )} 
                onClick={() => isCurrentMonth && handleDayClick(day)}
              >
              {/* Circular border showing occupancy */}
              <div className="absolute inset-0 rounded-full overflow-hidden" style={{
            background: isCurrentMonth && occupancyPercentage > 0 ? `conic-gradient(#3B82F6 ${occupancyPercentage}%, transparent 0)` : 'transparent',
            transform: 'rotate(-90deg)'
          }} />
              
              {/* Day number at center */}
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium z-10">
                {format(day, 'd')}
              </div>
              
              {/* Appointments count indicator */}
              {isCurrentMonth && appointmentsCount > 0 && <div className="absolute top-1 right-1 z-10 bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {appointmentsCount}
                </div>}
              
              {/* Blocks count indicator */}
              {isCurrentMonth && blocksCount > 0 && <div className="absolute top-1 left-1 z-10 bg-gray-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {blocksCount}
                </div>}
            </div>;
      })}
      </div>
      
      {/* Legend */}
      <div className="text-xs text-gray-500 mt-4">
        <p>Analise os agendamentos e bloqueios por cada data do mês selecionado.</p>
      </div>
    </div>;
};
