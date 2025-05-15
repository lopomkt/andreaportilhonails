
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useData } from "@/context/DataProvider";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, subDays, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeekDayColumn } from "./WeekDayColumn";
import { normalizeDateNoon, createDateWithNoon } from "@/lib/dateUtils";

interface WeekViewProps {
  date: Date;
  onDaySelect: (date: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  date,
  onDaySelect
}) => {
  // Ensure the date is normalized with noon time to avoid timezone issues
  const normalizedDate = normalizeDateNoon(date);
  const [currentWeek, setCurrentWeek] = useState<Date>(normalizedDate);
  
  // Recalculate current week when date changes
  useEffect(() => {
    setCurrentWeek(normalizedDate);
  }, [normalizedDate]);

  const { appointments, blockedDates } = useData();
  
  // Calculate the days in the current week using normalized dates
  const weekDays = useMemo(() => {
    // Start week on Sunday (locale-aware)
    const weekStart = startOfWeek(currentWeek, { locale: ptBR });
    const weekEnd = endOfWeek(currentWeek, { locale: ptBR });
    
    // Create an array of days in the current week
    return eachDayOfInterval({ 
      start: weekStart, 
      end: weekEnd 
    }).map(day => normalizeDateNoon(day));
  }, [currentWeek]);
  
  // Handle navigation to previous week
  const handlePrevWeek = useCallback(() => {
    setCurrentWeek(prev => {
      const newDate = subDays(prev, 7);
      return normalizeDateNoon(newDate);
    });
  }, []);
  
  // Handle navigation to next week
  const handleNextWeek = useCallback(() => {
    setCurrentWeek(prev => {
      const newDate = addDays(prev, 7);
      return normalizeDateNoon(newDate);
    });
  }, []);
  
  // Handle day selection
  const handleDayClick = useCallback((day: Date) => {
    const normalizedDay = normalizeDateNoon(day);
    onDaySelect(normalizedDay);
    
    // Store user preference for day view
    localStorage.setItem("calendarViewMode", "day");
  }, [onDaySelect]);
  
  // Get the unique month names for display in the header
  // This handles weeks that span two months
  const monthNames = useMemo(() => {
    const months = new Set(weekDays.map(day => 
      format(day, "MMMM", { locale: ptBR })
    ));
    return Array.from(months).join(" / ");
  }, [weekDays]);
  
  // Get the year for display in the header
  const yearDisplay = useMemo(() => {
    const years = new Set(weekDays.map(day => day.getFullYear()));
    return Array.from(years).join(" / ");
  }, [weekDays]);
  
  // Week days filtering - only show current month days when navigating between months
  const filteredWeekDays = useMemo(() => {
    // Check if the week spans across months
    const uniqueMonths = new Set(weekDays.map(day => day.getMonth()));
    
    // If week doesn't span across months, show all days
    if (uniqueMonths.size <= 1) {
      return weekDays;
    }
    
    // If we're spanning months, check which month has more days in this week
    const monthCounts: {[key: number]: number} = {};
    weekDays.forEach(day => {
      const month = day.getMonth();
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    
    // Find the month with the most days in this week
    const primaryMonth = Object.entries(monthCounts)
      .reduce((a, b) => (Number(b[1]) > Number(a[1]) ? b : a), ["0", 0])[0];
    
    // For now, let's show all days for better UX
    // Users expect to see the full week even when it spans months
    return weekDays;
  }, [weekDays]);

  return (
    <div className="week-view-container p-2">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={handlePrevWeek}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span>Semana anterior</span>
        </Button>
        
        <h2 className="text-lg font-semibold capitalize">
          {monthNames} {yearDisplay}
        </h2>
        
        <Button variant="ghost" onClick={handleNextWeek}>
          <span>Próxima semana</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {filteredWeekDays.map((day, index) => (
          <WeekDayColumn
            key={index}
            day={day}
            onDayClick={handleDayClick}
            appointments={appointments.filter(appt => {
              if (!appt) return false;
              const apptDate = normalizeDateNoon(new Date(appt.date));
              return isSameDay(apptDate, day);
            })}
            blockedDates={blockedDates.filter(block => {
              if (!block) return false;
              const blockDate = normalizeDateNoon(new Date(block.date));
              return isSameDay(blockDate, day);
            })}
          />
        ))}
      </div>
    </div>
  );
}
