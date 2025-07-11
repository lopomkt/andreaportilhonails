
import React, { useState, useEffect, useCallback } from "react";
import { DayView } from "@/components/calendar/day/DayView";
import { WeekView } from "@/components/calendar/WeekView";
import { MonthView } from "@/components/calendar/month/MonthView";
import { useData } from "@/context/DataProvider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { normalizeDateNoon } from "@/lib/dateUtils";
import { useErrorHandler } from "@/hooks/useErrorHandler";

export default function CalendarPage() {
  const { handleError } = useErrorHandler();
  const { appointments } = useData();
  
  // Use noon-normalized current date to avoid timezone issues
  const [selectedDate, setSelectedDate] = useState<Date>(() => normalizeDateNoon(new Date()));
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const { openModal } = useAppointmentsModal();
  
  // Load the view preference from localStorage on component mount
  useEffect(() => {
    try {
      const savedViewMode = localStorage.getItem("calendarViewMode") as "day" | "week" | "month" | null;
      if (savedViewMode && ["day", "week", "month"].includes(savedViewMode)) {
        setViewMode(savedViewMode);
      }
    } catch (error) {
      handleError(error, 'Erro ao carregar preferências');
    }
  }, [handleError]);
  
  // Save the view preference to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("calendarViewMode", viewMode);
    } catch (error) {
      handleError(error, 'Erro ao salvar preferências');
    }
  }, [viewMode, handleError]);

  const handleViewChange = useCallback((value: string) => {
    try {
      if (["day", "week", "month"].includes(value)) {
        setViewMode(value as "day" | "week" | "month");
        localStorage.setItem("calendarViewMode", value);
      }
    } catch (error) {
      handleError(error, 'Erro ao alterar visualização');
    }
  }, [handleError]);

  const handleDaySelect = useCallback((date: Date) => {
    try {
      // Ensure the date is properly normalized
      const normalizedDay = normalizeDateNoon(date);
      setSelectedDate(normalizedDay);
      
      // Check stored view mode preference when day is selected from week or month view
      const savedViewMode = localStorage.getItem("calendarViewMode") as "day" | "week" | "month" | null;
      if (savedViewMode === "day") {
        setViewMode("day");
      }
    } catch (error) {
      handleError(error, 'Erro ao selecionar data');
    }
  }, [handleError]);

  const handleNewAppointment = useCallback(() => {
    try {
      // Pass null for a new appointment, with the selected date
      openModal(null, selectedDate);
    } catch (error) {
      handleError(error, 'Erro ao criar agendamento');
    }
  }, [openModal, selectedDate, handleError]);

  const handleSuggestedTimeSelect = useCallback((date: Date, time: string) => {
    try {
      // Extract hours and minutes from time string (format: "HH:mm")
      const [hours, minutes] = time.split(":").map(Number);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error('Horário inválido');
      }
      
      // Create a new date object with the selected date and time
      const appointmentDate = normalizeDateNoon(date);
      appointmentDate.setHours(hours);
      appointmentDate.setMinutes(minutes);
      
      // Open modal with the suggested time
      openModal(null, appointmentDate);
    } catch (error) {
      handleError(error, 'Erro ao selecionar horário sugerido');
    }
  }, [openModal, handleError]);

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
            appointments={appointments}
            selectedDate={selectedDate} 
            onDateSelect={handleDaySelect}
            onAppointmentClick={(appointment) => openModal(appointment)}
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
