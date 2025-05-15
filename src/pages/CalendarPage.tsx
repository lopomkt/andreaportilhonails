
import React, { useState, useEffect, useCallback } from "react";
import { DayView } from "@/components/calendar/day/DayView";
import { WeekView } from "@/components/calendar/week/WeekView";
import { MonthView } from "@/components/calendar/month/MonthView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { normalizeDateNoon } from "@/lib/dateUtils";

export default function CalendarPage() {
  // Use noon-normalized current date to avoid timezone issues
  const [selectedDate, setSelectedDate] = useState<Date>(normalizeDateNoon(new Date()));
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const { openModal } = useAppointmentsModal();
  
  // Load the view preference from localStorage on component mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem("calendarViewMode") as "day" | "week" | "month" | null;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);
  
  // Save the view preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("calendarViewMode", viewMode);
  }, [viewMode]);

  const handleViewChange = useCallback((value: string) => {
    setViewMode(value as "day" | "week" | "month");
    localStorage.setItem("calendarViewMode", value);
  }, []);

  const handleDaySelect = useCallback((date: Date) => {
    // The date is already normalized by the calling component,
    // so we just use it directly without re-normalizing
    setSelectedDate(date);
    
    // Check stored view mode preference when day is selected from week or month view
    const savedViewMode = localStorage.getItem("calendarViewMode") as "day" | "week" | "month" | null;
    if (savedViewMode === "day") {
      setViewMode("day");
    }
  }, []);

  const handleNewAppointment = useCallback(() => {
    // Pass null for a new appointment, with the selected date
    openModal(null, selectedDate);
  }, [openModal, selectedDate]);

  const handleSuggestedTimeSelect = useCallback((date: Date, time: string) => {
    // Extract hours and minutes from time string (format: "HH:mm")
    const [hours, minutes] = time.split(":").map(Number);
    
    // Create a new date object with the selected date and time
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours);
    appointmentDate.setMinutes(minutes);
    
    // Open modal with the suggested time
    openModal(null, appointmentDate);
  }, [openModal]);

  return (
    <div className="px-4 py-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Calendário</h1>
        
        <div className="flex items-center gap-4">
          <Tabs 
            defaultValue={viewMode} 
            value={viewMode} 
            onValueChange={handleViewChange}
          >
            <TabsList>
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={handleNewAppointment}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo
          </Button>
        </div>
      </div>

      <div className="calendar-container mt-4">
        {viewMode === "day" && (
          <DayView 
            date={selectedDate} 
            onDaySelect={handleDaySelect} 
            onSuggestedTimeSelect={handleSuggestedTimeSelect}
          />
        )}
        {viewMode === "week" && (
          <WeekView 
            date={selectedDate} 
            onDaySelect={handleDaySelect}
          />
        )}
        {viewMode === "month" && (
          <MonthView 
            date={selectedDate} 
            onDaySelect={handleDaySelect}
          />
        )}
      </div>
    </div>
  );
}
