
import React from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns";
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
  
  // Use a Set to track unique week start times to prevent duplication
  const uniqueWeekStartTimes = new Set<number>();
  const uniqueWeekStarts: Date[] = [];
  
  // Filter weeks to only include unique ones
  weekStarts.forEach(weekStart => {
    const weekStartTime = weekStart.getTime();
    
    // Only add this week if we haven't processed it already
    if (!uniqueWeekStartTimes.has(weekStartTime)) {
      uniqueWeekStartTimes.add(weekStartTime);
      uniqueWeekStarts.push(new Date(weekStartTime));
    }
  });
  
  return (
    <div className="space-y-4">
      {uniqueWeekStarts.map((weekStart) => (
        <WeekView 
          key={weekStart.toISOString()} 
          date={weekStart} 
          onDaySelect={onDaySelect} 
        />
      ))}
    </div>
  );
};
