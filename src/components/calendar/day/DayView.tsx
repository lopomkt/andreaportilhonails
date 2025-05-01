
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataProvider';
import { isSameDay, addMinutes, isWithinInterval, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppointmentCard } from '@/components/calendar/day/AppointmentCard';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
import { Appointment } from '@/types';
import { TimeSlot } from '@/components/calendar/day/TimeSlot';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [timeSlots, setTimeSlots] = useState<Array<{ time: Date, appointments: Appointment[], isBlocked: boolean }>>([]);
  const { appointments, blockedDates } = useData();
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

  const handleAppointmentClick = (appointment: Appointment) => {
    // This is the correct type - we're opening the appointment modal with the appointment
    openModal(appointment);
  };

  return (
    <div className="day-view-container px-2 pt-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => onDaySelect && onDaySelect(addDays(date, -1))}>
          <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
          <span className="hidden md:inline">Dia anterior</span>
        </Button>

        <h2 className="text-lg font-bold">{format(date, "EEEE, dd MMMM", { locale: ptBR })}</h2>

        <Button variant="ghost" onClick={() => onDaySelect && onDaySelect(addDays(date, 1))}>
          <span className="hidden md:inline">Próximo dia</span>
          <ArrowRight className="h-4 w-4 ml-1 md:ml-2" />
        </Button>
      </div>
      
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
    </div>
  );
};
