
import React, { useEffect } from "react";
import { useData } from "@/context/DataProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DayView } from "./day/DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { SuggestedTimeSlots } from "../dashboard/SuggestedTimeSlots";
import { useTimeSlotsCalculation } from "@/hooks/dashboard/useTimeSlotsCalculation";

interface CalendarViewTabsProps {
  calendarView: "day" | "week" | "month";
  currentDate: Date;
  onDaySelect: (date: Date) => void;
  onViewChange: (view: string) => void;
  onSuggestedTimeSelect?: (date: Date, timeString: string) => void;
}

export function CalendarViewTabs({
  calendarView,
  currentDate,
  onDaySelect,
  onViewChange,
  onSuggestedTimeSelect,
}: CalendarViewTabsProps) {
  const { getAppointmentsForDate, fetchAppointments } = useData();
  const { suggestedSlots, calculateAvailableSlots } = useTimeSlotsCalculation(getAppointmentsForDate);

  // Refresh data and recalculate suggested slots when the component mounts or view changes
  useEffect(() => {
    const loadData = async () => {
      await fetchAppointments();
      calculateAvailableSlots();
    };
    
    loadData();
  }, [fetchAppointments, calculateAvailableSlots, calendarView]);

  return (
    <Tabs
      defaultValue={calendarView}
      value={calendarView}
      onValueChange={onViewChange}
      className="w-full"
    >
      <div className="flex justify-between items-center border-b px-4">
        <TabsList className="h-10">
          <TabsTrigger value="day" className="data-[state=active]:bg-rose-50">
            Dia
          </TabsTrigger>
          <TabsTrigger value="week" className="data-[state=active]:bg-rose-50">
            Semana
          </TabsTrigger>
          <TabsTrigger value="month" className="data-[state=active]:bg-rose-50">
            Mês
          </TabsTrigger>
        </TabsList>

        {/* Show suggested time slots in day view */}
        {calendarView === "day" && suggestedSlots.length > 0 && (
          <div className="hidden md:block">
            <SuggestedTimeSlots slots={suggestedSlots} />
          </div>
        )}
      </div>

      <TabsContent value="day" className="mt-0">
        <DayView 
          date={currentDate} 
          onDaySelect={onDaySelect} 
          onSuggestedTimeSelect={onSuggestedTimeSelect}
        />
      </TabsContent>
      
      <TabsContent value="week" className="mt-0">
        <WeekView date={currentDate} onDaySelect={onDaySelect} />
      </TabsContent>
      
      <TabsContent value="month" className="mt-0">
        <MonthView date={currentDate} onDaySelect={onDaySelect} />
      </TabsContent>
    </Tabs>
  );
}
