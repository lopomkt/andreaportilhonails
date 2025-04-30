
import { startOfMonth, endOfMonth, startOfWeek, addWeeks, isBefore } from "date-fns";
import { WeekView } from "./WeekView";

interface WeekGridProps {
  month: Date;
  onDaySelect: (date: Date) => void;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ month, onDaySelect }) => {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfMonth(month);
  const weeks = [];

  let weekStart = start;
  while (isBefore(weekStart, end) || weekStart.getTime() === end.getTime()) {
    weeks.push(
      <WeekView key={weekStart.toISOString()} date={weekStart} onDaySelect={onDaySelect} />
    );
    weekStart = addWeeks(weekStart, 1);
  }

  return (
    <div className="space-y-4">
      {weeks}
    </div>
  );
};
