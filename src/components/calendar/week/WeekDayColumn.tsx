
import React from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Appointment, BlockedDate } from '@/types';
import { normalizeDateNoon } from '@/lib/dateUtils';

interface WeekDayColumnProps {
  day: Date;
  onDayClick: (day: Date) => void;
  appointments: Appointment[];
  blockedDates: BlockedDate[];
}

export const WeekDayColumn: React.FC<WeekDayColumnProps> = ({
  day,
  onDayClick,
  appointments,
  blockedDates
}) => {
  const isToday = isSameDay(day, normalizeDateNoon(new Date()));
  const isWeekend = [0, 6].includes(day.getDay()); // 0 = Sunday, 6 = Saturday
  const hasAppointments = appointments.length > 0;
  const isFullDayBlocked = blockedDates.some(block => block.allDay);
  
  // Check if there are appointments for this day
  const appointmentItems = appointments.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div 
      className={cn(
        "week-day-column border rounded-md p-2",
        isToday ? "border-rose-500" : "border-gray-200",
        isWeekend ? "bg-gray-50" : "",
        isFullDayBlocked ? "bg-gray-100" : ""
      )}
    >
      <div 
        className="text-center py-2 cursor-pointer hover:bg-gray-100 rounded-md transition-colors"
        onClick={() => onDayClick(day)}
      >
        <div className="text-sm font-medium">
          {format(day, "EEE", { locale: ptBR })}
        </div>
        <div className={cn("text-xl", isToday && "text-rose-500 font-bold")}>
          {format(day, "d", { locale: ptBR })}
        </div>
      </div>
      
      <div className="mt-2 space-y-1">
        {isFullDayBlocked && (
          <div className="bg-gray-200 text-gray-700 text-xs p-1 rounded text-center">
            Dia bloqueado
          </div>
        )}
        
        {appointmentItems.map((appointment, idx) => (
          <div 
            key={appointment.id || idx} 
            className={cn(
              "text-xs p-1 rounded truncate",
              appointment.status === "confirmed" ? "bg-blue-100 text-blue-800" : 
              appointment.status === "canceled" ? "bg-red-100 text-red-800 line-through" : 
              "bg-amber-100 text-amber-800"
            )}
          >
            {format(new Date(appointment.date), "HH:mm")} - {appointment.client?.name || "Cliente"}
          </div>
        ))}
        
        {!isFullDayBlocked && !hasAppointments && (
          <div className="text-gray-400 text-xs text-center py-2">
            Sem agendamentos
          </div>
        )}
      </div>
    </div>
  );
};
