
import { startOfMonth, endOfMonth, startOfWeek, addWeeks } from "date-fns";
import { WeekView } from "./WeekView";

interface WeekGridProps {
  month: Date;
  onDaySelect: (date: Date) => void;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ month, onDaySelect }) => {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfMonth(month);
  const weeks = [];

  // Use fixed number of weeks instead of while loop
  // This prevents potential infinite loops and ensures consistent rendering
  const maxWeeks = 6; // Maximum number of weeks in any month view
  
  for (let i = 0; i < maxWeeks; i++) {
    const weekStart = addWeeks(start, i);
    // Only add weeks that might contain days from the current month
    if (i === 0 || weekStart <= end) {
      weeks.push(
        <WeekView key={weekStart.toISOString()} date={weekStart} onDaySelect={onDaySelect} />
      );
    }
  }

  return (
    <div className="space-y-4">
      {weeks}
    </div>
  );
};
