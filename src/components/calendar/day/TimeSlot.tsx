
import React from 'react';
import { format } from 'date-fns';
import { Clock, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Appointment } from '@/types';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppointmentCard } from '@/components/calendar/day/AppointmentCard';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';

interface TimeSlotProps {
  slot: { 
    time: Date; 
    appointments: Appointment[]; 
    isBlocked: boolean 
  };
  onAppointmentClick: (appointment: Appointment) => void;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({ slot, onAppointmentClick }) => {
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
        {appointments.map((appointment) => (
          <AppointmentCard 
            key={appointment.id} 
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
