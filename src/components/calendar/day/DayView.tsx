
import React, { useState, useEffect } from 'react';
import { format, isSameDay, parseISO, addMinutes, differenceInMinutes, setHours, isWithinInterval, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CalendarX, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AppointmentCard } from '@/components/calendar/day/AppointmentCard';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
import { Appointment } from '@/types';
import { useData } from '@/context/DataProvider';

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
  const { appointments, blockedDates, fetchAppointments, fetchBlockedDates } = useData();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [timeSlots, setTimeSlots] = useState<Array<{ 
    time: Date, 
    appointments: Appointment[], 
    isBlocked: boolean,
    blockReason?: string,
    isPartiallyBlocked?: boolean 
  }>>([]);
  const { openModal } = useAppointmentsModal();

  // Fetch fresh data when day view is shown
  useEffect(() => {
    const refreshData = async () => {
      await Promise.all([
        fetchAppointments(),
        fetchBlockedDates()
      ]);
    };
    
    refreshData();
  }, [date, fetchAppointments, fetchBlockedDates]);

  // Normalize date (without forcing a fixed time) - this fixes timezone issues
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  normalizedDate.setHours(0, 0, 0, 0);

  // Add navigation between days
  const handlePrevDay = () => {
    if (onDaySelect) onDaySelect(subDays(normalizedDate, 1));
  };
  const handleNextDay = () => {
    if (onDaySelect) onDaySelect(addDays(normalizedDate, 1));
  };

  // Generate time slots for the day (from 7:00 to 19:00)
  useEffect(() => {
    const slots = [];
    const startHour = 7;
    const endHour = 19;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === endHour && minute > 0) continue;
        
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Filter appointments that fall within this time slot
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
        
        // Check if time is blocked in blocked dates
        const timeBlock = blockedDates.find(blockedDate => {
          const blockDate = new Date(blockedDate.date);
          return isSameDay(blockDate, date) && blockedDate.allDay;
        });
        
        slots.push({
          time: slotTime,
          appointments: slotAppointments,
          isBlocked: !!timeBlock,
          blockReason: timeBlock?.reason
        });
      }
    }
    
    setTimeSlots(slots);
  }, [date, appointments, blockedDates]);

  return (
    <div className="day-view-container px-2 pt-4">
      {/* Day navigation */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrevDay}
          className="flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Dia anterior</span>
        </Button>
        
        <h3 className="text-lg font-medium">
          {format(normalizedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h3>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNextDay}
          className="flex items-center"
        >
          <span className="hidden md:inline">Próximo dia</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
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
    isBlocked: boolean;
    blockReason?: string;
  };
  onAppointmentClick: (appointment: Appointment) => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ slot, onAppointmentClick }) => {
  const { time, appointments, isBlocked, blockReason } = slot;
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
        appointments.length > 0 ? "bg-nail-50" : "",
        appointments.some(a => a.status === 'confirmed') ? "bg-green-50" : "",
        appointments.some(a => a.status === 'canceled') ? "bg-red-50" : ""
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
            {blockReason || "Bloqueado"}
          </Badge>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {appointments
          .filter(app => app.status !== 'canceled')
          .map((appointment, idx) => (
            <AppointmentCard 
              key={idx} 
              appointment={appointment} 
              onClick={() => onAppointmentClick(appointment)} 
              compact={appointments.length > 1}
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
