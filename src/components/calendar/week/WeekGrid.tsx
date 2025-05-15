
import React from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, isSameMonth, addDays } from "date-fns";
import { WeekView } from "./WeekView";
import { ptBR } from "date-fns/locale";

interface WeekGridProps {
  month: Date;
  onDaySelect: (date: Date) => void;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ month, onDaySelect }) => {
  // Get the first day of the month with noon time
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1, 12, 0, 0, 0);
  // Get the last day of the month with noon time
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12, 0, 0, 0);
  
  // Get all weeks that occur in this month, using the correct locale
  const weekStarts = eachWeekOfInterval(
    {
      start: monthStart,
      end: monthEnd
    },
    { locale: ptBR }  // Use the Brazilian Portuguese locale for proper week starts
  );
  
  // Filter weeks to only include those containing days from the current month
  // Normalize each week start to have noon time
  const validWeeks = weekStarts
    .map(weekStart => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 12, 0, 0, 0))
    .filter(weekStart => {
      const weekEnd = endOfWeek(weekStart, { locale: ptBR });
      const daysInWeek = [];
      
      // Check each day in the week
      for (let i = 0; i <= 6; i++) {
        const currentDay = addDays(weekStart, i);
        // Ensure each day has noon time
        const normalizedDay = new Date(
          currentDay.getFullYear(), 
          currentDay.getMonth(), 
          currentDay.getDate(), 
          12, 0, 0, 0
        );
        daysInWeek.push(normalizedDay);
      }
      
      // At least one day in the week must be in the current month
      return daysInWeek.some(day => isSameMonth(day, month));
    });
  
  return (
    <div className="space-y-4">
      {validWeeks.map((weekStart) => (
        <WeekView 
          key={weekStart.toISOString()} 
          date={weekStart} 
          onDaySelect={onDaySelect} 
        />
      ))}
    </div>
  );
};
