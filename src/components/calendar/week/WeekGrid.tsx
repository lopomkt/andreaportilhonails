
import React from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, eachWeekOfInterval } from "date-fns";
import { WeekView } from "./WeekView";

interface WeekGridProps {
  month: Date;
  onDaySelect: (date: Date) => void;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ month, onDaySelect }) => {
  // Get the first day of the month
  const monthStart = startOfMonth(month);
  // Get the last day of the month
  const monthEnd = endOfMonth(month);
  
  // Get all weeks that occur in this month
  const weekStarts = eachWeekOfInterval(
    {
      start: monthStart,
      end: monthEnd
    }
  );
  
  return (
    <div className="space-y-4">
      {weekStarts.map((weekStart) => (
        <WeekView 
          key={weekStart.toISOString()} 
          date={weekStart} 
          onDaySelect={onDaySelect} 
        />
      ))}
    </div>
  );
};
