
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DayView } from "@/components/calendar/day/DayView";
import { WeekView } from "@/components/calendar/week/WeekView";
import { MonthView } from "@/components/calendar/month/MonthView";

interface CalendarViewTabsProps {
  calendarView: "day" | "week" | "month";
  currentDate: Date;
  onDaySelect: (date: Date) => void;
  onSuggestedTimeSelect?: (date: Date, time: string) => void;
  onViewChange: (value: string) => void;
}

const LoadingView = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-pulse space-y-4 w-full">
      <div className="h-4 bg-accent rounded w-3/4"></div>
      <div className="space-y-3">
        <div className="h-20 bg-accent rounded"></div>
        <div className="h-20 bg-accent rounded"></div>
        <div className="h-20 bg-accent rounded"></div>
      </div>
    </div>
  </div>
);

export function CalendarViewTabs({
  calendarView,
  currentDate,
  onDaySelect,
  onSuggestedTimeSelect,
  onViewChange
}: CalendarViewTabsProps) {
  return (
    <Tabs defaultValue={calendarView} value={calendarView} onValueChange={onViewChange}>
      <div className="border-b px-6">
        <TabsList className="w-full justify-start h-14 bg-transparent border-b-0">
          <TabsTrigger value="day" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-14 px-6">
            Dia
          </TabsTrigger>
          <TabsTrigger value="week" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-14 px-6">
            Semana
          </TabsTrigger>
          <TabsTrigger value="month" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-14 px-6">
            Mês
          </TabsTrigger>
        </TabsList>
      </div>
      
      <Suspense fallback={<LoadingView />}>
        <TabsContent value="day" className="m-0">
          <DayView 
            date={currentDate}
            onDaySelect={onDaySelect}
            onSuggestedTimeSelect={onSuggestedTimeSelect}
          />
        </TabsContent>
        <TabsContent value="week" className="m-0">
          <WeekView date={currentDate} onDaySelect={onDaySelect} />
        </TabsContent>
        <TabsContent value="month" className="m-0">
          <MonthView date={currentDate} onDaySelect={onDaySelect} />
        </TabsContent>
      </Suspense>
    </Tabs>
  );
}
