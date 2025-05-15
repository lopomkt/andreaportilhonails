
import React from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, isSameMonth, addDays } from "date-fns";
import { WeekView } from "./WeekView";
import { ptBR } from "date-fns/locale";

interface WeekGridProps {
  month: Date;
  onDaySelect: (date: Date) => void;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ month, onDaySelect }) => {
  // Get the first day of the month
  const monthStart = startOfMonth(month);
  // Get the last day of the month
  const monthEnd = endOfMonth(month);
  
  // Get all weeks that occur in this month, using the correct locale
  const weekStarts = eachWeekOfInterval(
    {
      start: monthStart,
      end: monthEnd
    },
    { locale: ptBR }  // Use the Brazilian Portuguese locale for proper week starts
  );
  
  // Filter weeks to only include those containing days from the current month
  const validWeeks = weekStarts.filter(weekStart => {
    const weekEnd = endOfWeek(weekStart, { locale: ptBR });
    const daysInWeek = [];
    
    // Check each day in the week
    for (let i = 0; i <= 6; i++) {
      const currentDay = addDays(weekStart, i);
      daysInWeek.push(currentDay);
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
