import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { format, isSameDay, parseISO, addMinutes, differenceInMinutes, setHours, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AppointmentCard } from '@/components/calendar/day/AppointmentCard';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
import { Appointment } from '@/types';

export interface DayViewProps {
  date: Date;
  onDaySelect?: (date: Date) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  date,
  onDaySelect
}) => {
  const { appointments, blockedDates, services } = useSupabaseData();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [timeSlots, setTimeSlots] = useState<Array<{ time: Date, appointments: Appointment[], isBlocked: boolean }>>([]);
  const { openModal } = useAppointmentsModal();
  
  useEffect(() => {
    const slots = [];
    const startHour = 7;
    const endHour = 19;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === endHour && minute > 0) continue;
        
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
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
        
        const isTimeBlocked = blockedDates.some(blockedDate => {
          const blockDate = new Date(blockedDate.date);
          return isSameDay(blockDate, date) && blockedDate.allDay;
        });
        
        slots.push({
          time: slotTime,
          appointments: slotAppointments,
          isBlocked: isTimeBlocked
        });
      }
    }
    
    setTimeSlots(slots);
  }, [date, appointments, blockedDates]);

  return (
    <div className="day-view-container px-2 pt-4">
      <div className="time-slots grid gap-3">
        {timeSlots.map((slot, index) => (
          <TimeSlot 
            key={index} 
            slot={slot} 
            onAppointmentClick={setSelectedAppointment} 
          />
        ))}
      </div>
    </div>
  );
};

interface TimeSlotProps {
  slot: { 
    time: Date; 
    appointments: Appointment[]; 
    isBlocked: boolean 
  };
  onAppointmentClick: (appointment: Appointment) => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ slot, onAppointmentClick }) => {
  const { time, appointments, isBlocked } = slot;
  const { openModal } = useAppointmentsModal();
  
  const handleTimeClick = () => {
    if (!isBlocked && appointments.length === 0) {
      openModal(undefined, time);
    }
  };
  
  return (
    <div 
      className={cn(
        "p-2 border rounded-md flex items-center justify-between",
        isBlocked ? "bg-gray-100" : "hover:bg-gray-50 cursor-pointer",
        appointments.length > 0 ? "bg-nail-50" : ""
      )}
      onClick={handleTimeClick}
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    openModal(undefined, time); 
                  }}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Agendar
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clique para agendar neste horário</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
