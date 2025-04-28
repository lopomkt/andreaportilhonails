
import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { format, isSameDay, parseISO, addMinutes, differenceInMinutes, setHours, isWithinInterval, addDays, subDays, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CalendarX, Scissors, Star, MessageSquare, Loader2, Clock, CalendarClock, ArrowLeft, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Appointment, AppointmentStatus, BlockedDate } from '@/types';
import { cn } from "@/lib/utils";
import { formatMinutesToHumanTime } from '@/lib/formatters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
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
  const { appointments, blockedDates, services } = useData();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [timeSlots, setTimeSlots] = useState<Array<{ 
    time: Date, 
    appointments: Appointment[], 
    isBlocked: boolean,
    blockReason?: string,
    isPartiallyBlocked?: boolean 
  }>>([]);
  const isMobile = useIsMobile();
  const { openModal } = useAppointmentsModal();

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
        // Don't add 19:30
        if (hour === endHour && minute > 0) continue;
        
        const slotTime = new Date(normalizedDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Fix: Normalize appointment dates for proper comparison
        const slotAppointments = appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.date);
          
          // For proper comparison, check day first
          if (!isSameDay(appointmentDate, normalizedDate)) {
            return false;
          }
          
          const appointmentEndTime = appointment.endTime 
            ? new Date(appointment.endTime)
            : addMinutes(appointmentDate, appointment.service?.durationMinutes || 60);
            
          return isWithinInterval(slotTime, {
            start: appointmentDate,
            end: appointmentEndTime
          });
        });
        
        // Check if time is blocked - normalize blocked dates too
        const blockedDate = blockedDates.find(blockedDate => {
          const blockDate = new Date(blockedDate.date);
          return isSameDay(blockDate, normalizedDate);
        });
        
        let isBlocked = false;
        let blockReason = '';
        let isPartiallyBlocked = false;
        
        if (blockedDate) {
          if (blockedDate.allDay || blockedDate.dia_todo) {
            isBlocked = true;
            blockReason = blockedDate.reason || 'Dia bloqueado';
          } else if (blockedDate.valor) {
            // Check for time-specific block (valor = start time, description = end time)
            try {
              const blockStartTime = parse(blockedDate.valor, 'HH:mm', new Date());
              const blockStartHour = blockStartTime.getHours();
              const blockStartMinute = blockStartTime.getMinutes();
              
              let blockEndTime;
              if (blockedDate.description) {
                blockEndTime = parse(blockedDate.description, 'HH:mm', new Date());
              } else {
                // Default to 1 hour if no end time specified
                blockEndTime = new Date(blockStartTime);
                blockEndTime.setHours(blockEndTime.getHours() + 1);
              }
              const blockEndHour = blockEndTime.getHours();
              const blockEndMinute = blockEndTime.getMinutes();
              
              if ((hour > blockStartHour || (hour === blockStartHour && minute >= blockStartMinute)) && 
                  (hour < blockEndHour || (hour === blockEndHour && minute < blockEndMinute))) {
                isBlocked = true;
                isPartiallyBlocked = true;
                blockReason = blockedDate.reason || 'Horário bloqueado';
              }
            } catch (err) {
              console.error("Error parsing blocked time:", err);
            }
          }
        }
        
        slots.push({
          time: slotTime,
          appointments: slotAppointments,
          isBlocked,
          blockReason,
          isPartiallyBlocked
        });
      }
    }
    
    setTimeSlots(slots);
  }, [normalizedDate, appointments, blockedDates]);

  const handleTimeClick = (time: Date) => {
    // Open appointment modal with the selected date/time
    if (onSuggestedTimeSelect) {
      onSuggestedTimeSelect(time, format(time, 'HH:mm'));
    } else {
      openModal(null, time);
    }
  };

  return (
    <div className="day-view-container px-2 pt-4">
      {/* Navegação entre dias - Versão melhorada para desktop e mobile */}
      <div className="flex items-center justify-between mb-3">
        {isMobile ? (
          // Mobile layout: seta esquerda | data | seta direita
          <>
            <Button
              size="icon"
              variant="outline"
              onClick={handlePrevDay}
              className="flex-shrink-0"
              aria-label="Dia anterior"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-body font-medium text-center px-1 truncate">
              {format(normalizedDate, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={handleNextDay}
              className="flex-shrink-0"
              aria-label="Próximo dia"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </>
        ) : (
          // Desktop layout: texto centralizado com setas nas laterais
          <div className="w-full flex items-center justify-center gap-4">
            <Button
              size="icon"
              variant="outline"
              onClick={handlePrevDay}
              className="flex-shrink-0"
              aria-label="Dia anterior"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-body font-medium text-center">
              {format(normalizedDate, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
            </h3>
            <Button
              size="icon"
              variant="outline"
              onClick={handleNextDay}
              className="flex-shrink-0"
              aria-label="Próximo dia"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="time-slots grid gap-3">
        {timeSlots.map((slot, index) => (
          <TimeSlot 
            key={index} 
            slot={slot} 
            onTimeClick={handleTimeClick}
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
    isPartiallyBlocked?: boolean;
  };
  onTimeClick: (time: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ slot, onTimeClick, onAppointmentClick }) => {
  const { time, appointments, isBlocked, blockReason, isPartiallyBlocked } = slot;
  
  return (
    <div 
      className={cn(
        "p-2 border rounded-md flex items-center justify-between",
        isBlocked ? "bg-gray-100" : "hover:bg-gray-50 cursor-pointer",
        isPartiallyBlocked ? "bg-gray-50 border-red-100" : "",
        appointments.length > 0 ? "bg-nail-50" : ""
      )}
      onClick={() => !isBlocked && appointments.length === 0 && onTimeClick(time)}
    >
      <div className="flex items-center">
        <div className="text-sm font-medium mr-2">
          {format(time, 'HH:mm')}
        </div>
        
        {isBlocked && (
          <Badge variant="outline" className={cn(
            "bg-gray-200 text-gray-700",
            isPartiallyBlocked ? "bg-red-50 text-red-700 border-red-200" : ""
          )}>
            <CalendarX className="h-3 w-3 mr-1" />
            {isPartiallyBlocked ? "Horário bloqueado" : "Bloqueado"} 
            {blockReason && `: ${blockReason}`}
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
                    onTimeClick(time); 
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
