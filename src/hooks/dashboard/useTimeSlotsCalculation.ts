
import { useState, useEffect, useCallback } from 'react';
import { addDays, isToday } from 'date-fns';

interface TimeSlot {
  time: Date;
  duration: number;
}

export const useTimeSlotsCalculation = (getAppointmentsForDate: (date: Date) => any[]) => {
  const [suggestedSlots, setSuggestedSlots] = useState<TimeSlot[]>([]);

  const calculateAvailableSlots = useCallback(() => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const todayAppointments = getAppointmentsForDate(today).filter(appt => appt.status !== 'canceled');
    const tomorrowAppointments = getAppointmentsForDate(tomorrow).filter(appt => appt.status !== 'canceled');
    const businessHoursStart = 8;
    const businessHoursEnd = 19;
    const avgServiceDuration = 90;

    const findGapsInDay = (dayDate: Date, dayAppointments: any[]) => {
      const sortedAppointments = [...dayAppointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const slots: TimeSlot[] = [];
      let startTime: Date;
      if (isToday(dayDate)) {
        startTime = new Date();
        startTime.setMinutes(Math.ceil(startTime.getMinutes() / 15) * 15, 0, 0);
      } else {
        startTime = new Date(dayDate);
        startTime.setHours(businessHoursStart, 0, 0, 0);
      }
      const endTime = new Date(dayDate);
      endTime.setHours(businessHoursEnd, 0, 0, 0);
      if (startTime > endTime) return [];
      
      if (sortedAppointments.length === 0) {
        const duration = (endTime.getTime() - startTime.getTime()) / (60 * 1000);
        if (duration >= avgServiceDuration) {
          slots.push({
            time: startTime,
            duration: duration
          });
        }
        return slots;
      }

      const firstAppt = sortedAppointments[0];
      const firstApptTime = new Date(firstAppt.date);
      if (firstApptTime > startTime) {
        const duration = (firstApptTime.getTime() - startTime.getTime()) / (60 * 1000);
        if (duration >= avgServiceDuration) {
          slots.push({
            time: startTime,
            duration: duration
          });
        }
      }

      for (let i = 0; i < sortedAppointments.length - 1; i++) {
        const currentEnd = new Date(sortedAppointments[i].date);
        if (sortedAppointments[i].endTime) {
          currentEnd.setTime(new Date(sortedAppointments[i].endTime).getTime());
        } else {
          currentEnd.setMinutes(currentEnd.getMinutes() + 60);
        }
        const nextStart = new Date(sortedAppointments[i + 1].date);
        if (nextStart > currentEnd) {
          const duration = (nextStart.getTime() - currentEnd.getTime()) / (60 * 1000);
          if (duration >= avgServiceDuration) {
            slots.push({
              time: currentEnd,
              duration: duration
            });
          }
        }
      }

      const lastAppt = sortedAppointments[sortedAppointments.length - 1];
      const lastApptEnd = new Date(lastAppt.date);
      if (lastAppt.endTime) {
        lastApptEnd.setTime(new Date(lastAppt.endTime).getTime());
      } else {
        lastApptEnd.setMinutes(lastApptEnd.getMinutes() + 60);
      }
      if (lastApptEnd < endTime) {
        const duration = (endTime.getTime() - lastApptEnd.getTime()) / (60 * 1000);
        if (duration >= avgServiceDuration) {
          slots.push({
            time: lastApptEnd,
            duration: duration
          });
        }
      }
      return slots;
    };

    const todaySlots = findGapsInDay(today, todayAppointments);
    const tomorrowSlots = findGapsInDay(tomorrow, tomorrowAppointments);
    const allSlots = [...todaySlots, ...tomorrowSlots].sort((a, b) => {
      if (Math.abs(a.duration - avgServiceDuration) !== Math.abs(b.duration - avgServiceDuration)) {
        return Math.abs(a.duration - avgServiceDuration) - Math.abs(b.duration - avgServiceDuration);
      }
      return a.time.getTime() - b.time.getTime();
    });
    setSuggestedSlots(allSlots.slice(0, 3));
  }, [getAppointmentsForDate]);

  useEffect(() => {
    calculateAvailableSlots();
  }, [calculateAvailableSlots]);

  return { suggestedSlots, calculateAvailableSlots };
};
