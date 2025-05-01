
import { Appointment } from "@/types";
import { isSameDay, addMinutes, isWithinInterval } from "date-fns";

interface TimeSlot {
  time: Date;
  duration: number;
}

export const calculateAvailableTimeSlots = (
  appointments: Appointment[],
  blockedDates: any[] = [],
  startDate: Date = new Date(),
  daysAhead: number = 1
): TimeSlot[] => {
  const availableSlots: TimeSlot[] = [];
  const businessHoursStart = 8;
  const businessHoursEnd = 19;
  const avgServiceDuration = 90; // in minutes
  
  const now = new Date();
  
  // Check for the next 'daysAhead' days
  for (let i = 0; i < daysAhead; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Skip dates that are blocked
    if (blockedDates.some(blockedDate => isSameDay(new Date(blockedDate.date), currentDate))) {
      continue;
    }
    
    // Get appointments for this day
    const appointmentsForDay = appointments.filter(appointment => 
      appointment.status !== "canceled" && 
      isSameDay(new Date(appointment.date), currentDate)
    );
    
    // Sort appointments by start time
    const sortedAppointments = [...appointmentsForDay].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Create time slots
    let startTime: Date;
    
    // If it's today, start from current time (rounded up to nearest 30 min)
    if (isSameDay(currentDate, now)) {
      startTime = new Date(now);
      const minutes = startTime.getMinutes();
      startTime.setMinutes(minutes + (30 - minutes % 30), 0, 0);
    } else {
      startTime = new Date(currentDate);
      startTime.setHours(businessHoursStart, 0, 0, 0);
    }
    
    const endTime = new Date(currentDate);
    endTime.setHours(businessHoursEnd, 0, 0, 0);
    
    if (startTime > endTime) continue;
    
    // No appointments for the day - the whole day is available
    if (sortedAppointments.length === 0) {
      const duration = (endTime.getTime() - startTime.getTime()) / (60 * 1000);
      if (duration >= avgServiceDuration) {
        availableSlots.push({
          time: new Date(startTime),
          duration: duration
        });
      }
      continue;
    }
    
    // Check for gap before first appointment
    const firstAppointmentTime = new Date(sortedAppointments[0].date);
    if (firstAppointmentTime > startTime) {
      const duration = (firstAppointmentTime.getTime() - startTime.getTime()) / (60 * 1000);
      if (duration >= avgServiceDuration) {
        availableSlots.push({
          time: new Date(startTime),
          duration: duration
        });
      }
    }
    
    // Check for gaps between appointments
    for (let j = 0; j < sortedAppointments.length - 1; j++) {
      const currentApptEnd = new Date(sortedAppointments[j].date);
      const nextApptStart = new Date(sortedAppointments[j + 1].date);
      
      // Add service duration to current appointment end time
      const serviceDuration = sortedAppointments[j].service?.durationMinutes || 60;
      currentApptEnd.setMinutes(currentApptEnd.getMinutes() + serviceDuration);
      
      if (nextApptStart > currentApptEnd) {
        const duration = (nextApptStart.getTime() - currentApptEnd.getTime()) / (60 * 1000);
        if (duration >= avgServiceDuration) {
          availableSlots.push({
            time: new Date(currentApptEnd),
            duration: duration
          });
        }
      }
    }
    
    // Check for gap after last appointment
    const lastAppt = sortedAppointments[sortedAppointments.length - 1];
    const lastApptEnd = new Date(lastAppt.date);
    const lastServiceDuration = lastAppt.service?.durationMinutes || 60;
    lastApptEnd.setMinutes(lastApptEnd.getMinutes() + lastServiceDuration);
    
    if (lastApptEnd < endTime) {
      const duration = (endTime.getTime() - lastApptEnd.getTime()) / (60 * 1000);
      if (duration >= avgServiceDuration) {
        availableSlots.push({
          time: new Date(lastApptEnd),
          duration: duration
        });
      }
    }
  }
  
  // Sort slots by best fit for average service duration
  return availableSlots.sort((a, b) => {
    // First compare by how close the duration is to the average service duration
    const diffA = Math.abs(a.duration - avgServiceDuration);
    const diffB = Math.abs(b.duration - avgServiceDuration);
    if (diffA !== diffB) {
      return diffA - diffB;
    }
    // If durations are equally good, sort by earliest time
    return a.time.getTime() - b.time.getTime();
  });
};
