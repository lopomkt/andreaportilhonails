
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataProvider';
import { isSameDay, addMinutes, isWithinInterval } from 'date-fns';
import { AppointmentCard } from '@/components/calendar/day/AppointmentCard';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
import { Appointment } from '@/types';
import { TimeSlot } from '@/components/calendar/day/TimeSlot';

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
            onAppointmentClick={(appointment) => openModal(appointment)}
            onSuggestedTimeSelect={onSuggestedTimeSelect}
          />
        ))}
      </div>
    </div>
  );
};
