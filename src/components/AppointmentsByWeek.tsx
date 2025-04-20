import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Appointment } from "@/types";
import { startOfWeek, endOfWeek, addDays, format, isSameDay, subWeeks, addWeeks, getWeekOfMonth } from "date-fns";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
interface AppointmentsByWeekProps {
  appointments: Appointment[];
}
export function AppointmentsByWeek({
  appointments
}: AppointmentsByWeekProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), {
    weekStartsOn: 0
  }));
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  const navigate = useNavigate();

  // Listen for window resize events to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const currentWeekEnd = endOfWeek(currentWeekStart, {
    weekStartsOn: 0
  });

  // Filter appointments for the current week
  const weekAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date);
    return appointmentDate >= currentWeekStart && appointmentDate <= currentWeekEnd;
  });

  // Calculate total revenue for the week
  const weekRevenue = weekAppointments.filter(appt => appt.status !== "canceled").reduce((total, appt) => total + appt.price, 0);

  // Get week number of month
  const weekNumber = getWeekOfMonth(currentWeekStart, {
    locale: ptBR
  });

  // Group appointments by day
  const groupedAppointments = Array.from({
    length: 7
  }, (_, i) => {
    const day = addDays(currentWeekStart, i);
    const dayAppointments = weekAppointments.filter(appointment => isSameDay(new Date(appointment.date), day));
    return {
      date: day,
      appointments: dayAppointments,
      count: dayAppointments.length
    };
  });

  // Go to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  // Go to next week
  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  // Navigate to calendar view for a specific date
  const navigateToDate = (date: Date) => {
    navigate(`/calendario?date=${format(date, 'yyyy-MM-dd')}`);
  };
  return <Card className="card-premium">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center text-rose-700 text-base font-bold">
          <Calendar className="mr-2 h-5 w-5 text-rose-600" />
          Agenda da Semana
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="text-xs h-8 px-2 border-rose-200 hover:bg-rose-50 hover:text-rose-700">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {!isMobile && "Semana Anterior"}
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek} className="text-xs h-8 px-2 border-rose-200 hover:bg-rose-50 hover:text-rose-700">
            {!isMobile && "Próxima Semana"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-center mb-4">
          <h3 className="text-base font-medium px-0 my-[10px]">
            S{weekNumber} ({format(currentWeekStart, 'dd', {
            locale: ptBR
          })}–{format(currentWeekEnd, 'dd/MM', {
            locale: ptBR
          })})
          </h3>
          <p className="text-sm text-muted-foreground">
            {weekAppointments.length} Agendados • {weekRevenue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })}
          </p>
        </div>
      
        <div className="grid grid-cols-7 gap-1">
          {groupedAppointments.map((item, index) => {})}
        </div>
      </CardContent>
    </Card>;
}