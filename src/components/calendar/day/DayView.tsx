
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataProvider';
import { isSameDay, addDays, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppointmentCard } from '@/components/calendar/day/AppointmentCard';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
import { Appointment } from '@/types';
import { TimeSlot } from '@/components/calendar/day/TimeSlot';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { EditAppointmentModal } from '@/components/EditAppointmentModal';
import { normalizeDateNoon } from '@/lib/dateUtils';

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
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [timeSlots, setTimeSlots] = useState<Array<{ time: Date, appointments: Appointment[], isBlocked: boolean }>>([]);
  const { appointments, blockedDates, refetchAppointments } = useData();
  const { openModal } = useAppointmentsModal();
  
  // Filter appointments for the current day using isSameDay with normalized dates
  const dayAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    return appointments.filter(appointment => {
      if (!appointment) return false;
      
      const appointmentDate = normalizeDateNoon(new Date(appointment.date));
      const normalizedDate = normalizeDateNoon(date);
      return isSameDay(appointmentDate, normalizedDate);
    });
  }, [appointments, date]);
  
  useEffect(() => {
    const slots = [];
    // Set business hours from 7:00 to 19:00
    const startHour = 7;
    const endHour = 19;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === endHour && minute > 0) continue;
        
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Get all appointments for this time slot regardless of status
        const slotAppointments = dayAppointments.filter(appointment => {
          // Only consider confirmed appointments for blocking
          if (appointment.status !== 'confirmed') return false;
          
          const appointmentDate = new Date(appointment.date);
          const appointmentEndTime = appointment.endTime 
            ? new Date(appointment.endTime)
            : new Date(appointmentDate.getTime() + (appointment.service?.durationMinutes || 60) * 60000);
            
          return isWithinInterval(slotTime, {
            start: appointmentDate,
            end: appointmentEndTime
          });
        });
        
        // Check if the date is blocked as a whole day
        const isTimeBlocked = blockedDates.some(blockedDate => {
          if (!blockedDate) return false;
          
          const blockDate = normalizeDateNoon(new Date(blockedDate.date));
          const normalizedDate = normalizeDateNoon(date);
          return isSameDay(blockDate, normalizedDate) && blockedDate.allDay;
        });
        
        slots.push({
          time: slotTime,
          appointments: dayAppointments.filter(appointment => {
            if (!appointment) return false;
            
            const appointmentDate = new Date(appointment.date);
            const appointmentHour = appointmentDate.getHours();
            const appointmentMinute = appointmentDate.getMinutes();
            return appointmentHour === hour && appointmentMinute === minute;
          }),
          isBlocked: isTimeBlocked
        });
      }
    }
    
    setTimeSlots(slots);
  }, [date, dayAppointments, blockedDates]);

  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
  }, []);

  // Fixed day navigation to properly handle exactly one day at a time
  const handlePreviousDay = useCallback(() => {
    if (onDaySelect) {
      // Create a normalized date with noon time to avoid timezone issues
      const normalizedDate = normalizeDateNoon(date);
      
      // Subtract exactly one day using addDays with -1
      const previousDay = addDays(normalizedDate, -1);
      
      // Call the onDaySelect handler with the normalized date
      onDaySelect(previousDay);
    }
  }, [date, onDaySelect]);

  // Fixed next day navigation to properly handle exactly one day at a time
  const handleNextDay = useCallback(() => {
    if (onDaySelect) {
      // Create a normalized date with noon time to avoid timezone issues
      const normalizedDate = normalizeDateNoon(date);
      
      // Add exactly one day
      const nextDay = addDays(normalizedDate, 1);
      
      // Call the onDaySelect handler with the normalized date
      onDaySelect(nextDay);
    }
  }, [date, onDaySelect]);

  return (
    <div className="day-view-container px-2 pt-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={handlePreviousDay}>
          <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
          <span className="hidden md:inline">Dia anterior</span>
        </Button>

        <h2 className="text-lg font-bold">{format(date, "EEEE, dd MMMM", { locale: ptBR })}</h2>

        <Button variant="ghost" onClick={handleNextDay}>
          <span className="hidden md:inline">Próximo dia</span>
          <ArrowRight className="h-4 w-4 ml-1 md:ml-2" />
        </Button>
      </div>
      
      {dayAppointments.length === 0 && !timeSlots.some(slot => slot.isBlocked) ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum agendamento encontrado para esta data.
        </div>
      ) : (
        <div className="time-slots grid gap-3">
          {timeSlots.map((slot, index) => (
            <TimeSlot 
              key={index} 
              slot={slot} 
              onAppointmentClick={handleAppointmentClick}
              onSuggestedTimeSelect={onSuggestedTimeSelect}
            />
          ))}
        </div>
      )}

      {/* Render the EditAppointmentModal when an appointment is selected for editing */}
      {editingAppointment && (
        <EditAppointmentModal 
          appointment={editingAppointment} 
          onClose={() => setEditingAppointment(null)} 
          onSuccess={refetchAppointments} 
        />
      )}
    </div>
  );
}
