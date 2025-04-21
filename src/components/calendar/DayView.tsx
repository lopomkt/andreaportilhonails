
import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { format, isSameDay, parseISO, addMinutes, differenceInMinutes, setHours, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CalendarX, Scissors, Star, MessageSquare, Loader2, Clock, CalendarClock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Appointment, AppointmentStatus, BlockedDate } from '@/types';
import { cn } from "@/lib/utils";
import { formatMinutesToHumanTime } from '@/lib/formatters';

export interface DayViewProps {
  date: Date;
  onDaySelect?: (date: Date) => void;
  onSuggestedTimeSelect?: (date: Date, time: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  date,
  onDaySelect,
  onSuggestedTimeSelect
}) => {
  const { appointments, blockedDates, services } = useSupabaseData();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [timeSlots, setTimeSlots] = useState<Array<{ time: Date, appointments: Appointment[], isBlocked: boolean }>>([]);

  // Normalize date to avoid timezone issues
  const normalizedDate = setHours(new Date(date), 12, 0, 0);

  // Generate time slots for the day (from 7:00 to 22:00)
  useEffect(() => {
    const slots = [];
    const startHour = 7;
    const endHour = 22;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(normalizedDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Check if this time slot has appointments
        const slotAppointments = appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.date);
          const appointmentEndTime = appointment.endTime 
            ? new Date(appointment.endTime)
            : addMinutes(appointmentDate, appointment.service?.durationMinutes || 60);
            
          return isWithinInterval(slotTime, {
            start: appointmentDate,
            end: appointmentEndTime
          });
        });
        
        // Check if time is blocked
        const isTimeBlocked = blockedDates.some(blockedDate => {
          const blockDate = new Date(blockedDate.date);
          return isSameDay(blockDate, normalizedDate) && blockedDate.allDay;
        });
        
        slots.push({
          time: slotTime,
          appointments: slotAppointments,
          isBlocked: isTimeBlocked
        });
      }
    }
    
    setTimeSlots(slots);
  }, [normalizedDate, appointments, blockedDates]);

  const handleTimeClick = (time: Date) => {
    if (onSuggestedTimeSelect) {
      onSuggestedTimeSelect(normalizedDate, format(time, 'HH:mm'));
    }
  };

  return (
    <div className="day-view-container">
      <h3 className="text-lg font-medium mb-4">
        {format(normalizedDate, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
      </h3>
      
      <div className="time-slots grid gap-2">
        {timeSlots.map((slot, index) => (
          <TimeSlot 
            key={index} 
            slot={slot} 
            onTimeClick={handleTimeClick} 
            onAppointmentClick={setSelectedAppointment} 
          />
        ))}
      </div>

      {/* Appointment details dialog would go here */}
    </div>
  );
};

interface TimeSlotProps {
  slot: { 
    time: Date; 
    appointments: Appointment[]; 
    isBlocked: boolean 
  };
  onTimeClick: (time: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ slot, onTimeClick, onAppointmentClick }) => {
  const { time, appointments, isBlocked } = slot;
  
  return (
    <div 
      className={cn(
        "p-2 border rounded-md flex items-center justify-between",
        isBlocked ? "bg-gray-100" : "hover:bg-gray-50 cursor-pointer",
        appointments.length > 0 ? "bg-nail-50" : ""
      )}
      onClick={() => !isBlocked && appointments.length === 0 && onTimeClick(time)}
    >
      <div className="flex items-center">
        <div className="text-sm font-medium mr-2">
          {format(time, 'HH:mm')}
        </div>
        
        {isBlocked && (
          <Badge variant="outline" className="bg-gray-200 text-gray-700">
            <CalendarX className="h-3 w-3 mr-1" />
            Bloqueado
          </Badge>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {appointments.map((appointment, idx) => (
          <AppointmentCard 
            key={idx} 
            appointment={appointment} 
            onClick={() => onAppointmentClick(appointment)} 
          />
        ))}
        
        {!isBlocked && appointments.length === 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={(e) => { 
              e.stopPropagation(); 
              onTimeClick(time); 
            }}
          >
            <Clock className="h-3 w-3 mr-1" />
            Agendar
          </Button>
        )}
      </div>
    </div>
  );
};

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick }) => {
  const appointmentDate = new Date(appointment.date);
  const endTime = appointment.endTime 
    ? new Date(appointment.endTime) 
    : addMinutes(appointmentDate, appointment.service?.durationMinutes || 60);
  
  const duration = differenceInMinutes(endTime, appointmentDate);
  
  return (
    <Card 
      className={cn(
        "w-full max-w-sm cursor-pointer hover:shadow-md transition-shadow",
        appointment.status === "confirmed" ? "border-l-4 border-l-green-500" :
        appointment.status === "pending" ? "border-l-4 border-l-amber-500" :
        "border-l-4 border-l-red-500"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-medium">{appointment.client?.name}</h4>
            <p className="text-xs text-muted-foreground">{appointment.service?.name}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>
                {format(appointmentDate, 'HH:mm')} - {format(endTime, 'HH:mm')}
                {' '}({formatMinutesToHumanTime(duration)})
              </span>
            </div>
          </div>
          
          <Badge 
            className={cn(
              "ml-2",
              appointment.status === "confirmed" ? "bg-green-100 text-green-800" :
              appointment.status === "pending" ? "bg-amber-100 text-amber-800" :
              "bg-red-100 text-red-800"
            )}
          >
            {appointment.status === "confirmed" ? "Confirmado" : 
             appointment.status === "pending" ? "Pendente" : "Cancelado"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
