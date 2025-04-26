
import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { format, isSameDay, parseISO, addMinutes, differenceInMinutes, setHours, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeSlot } from './TimeSlot';
import { Appointment } from '@/types';
import { cn } from "@/lib/utils";

export interface DayViewProps {
  date: Date;
  onDaySelect?: (date: Date) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  date,
  onDaySelect
}) => {
  const { appointments, blockedDates } = useSupabaseData();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [timeSlots, setTimeSlots] = useState<Array<{ time: Date, appointments: Appointment[], isBlocked: boolean }>>([]);

  useEffect(() => {
    const slots = [];
    const startHour = 7;  // Start at 7:00 AM
    const endHour = 19;   // End at 7:00 PM (19:00) - fixing per requirement #3
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === endHour && minute > 0) continue; // Skip slots after 19:00
        
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
}
