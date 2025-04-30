import { startOfMonth, endOfMonth, startOfWeek, addWeeks, isBefore } from "date-fns";

const renderWeeksOfMonth = () => {
  const start = startOfWeek(startOfMonth(currentMonth));
  const end = endOfMonth(currentMonth);
  const weeks = [];

  let weekStart = start;

  while (isBefore(weekStart, end)) {
    weeks.push(
      <WeekView key={weekStart.toISOString()} date={weekStart} onDaySelect={onDaySelect} />
    );
    weekStart = addWeeks(weekStart, 1);
  }

  return weeks;
};
