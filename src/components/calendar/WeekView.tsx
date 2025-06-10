
import React, { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, addMinutes, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';

interface WeekViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
}

export function WeekView({ appointments, selectedDate, onDateSelect, onAppointmentClick }: WeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);
  const { openModal } = useAppointmentsModal();

  // Calculate week bounds
  const weekStart = useMemo(() => startOfWeek(currentWeek, { locale: ptBR }), [currentWeek]);
  const weekEnd = useMemo(() => endOfWeek(currentWeek, { locale: ptBR }), [currentWeek]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    onDateSelect(today);
  };

  // Time slots for the week view
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour < 19; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    slots.push('19:00');
    return slots;
  }, []);

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.date), day) && 
      appointment.status !== 'canceled'
    );
  };

  // Get appointment style for positioning
  const getAppointmentStyle = (appointment: Appointment) => {
    const appointmentDate = new Date(appointment.date);
    const hour = appointmentDate.getHours();
    const minutes = appointmentDate.getMinutes();
    
    // Calculate position from 7:00 AM
    const startMinutes = (hour - 7) * 60 + minutes;
    const topPosition = (startMinutes / 30) * 2.5; // 2.5rem per 30min slot
    
    // Calculate height based on service duration
    const duration = appointment.service?.durationMinutes || 60;
    const height = (duration / 30) * 2.5;
    
    return {
      top: `${topPosition}rem`,
      height: `${height}rem`,
      minHeight: '2rem'
    };
  };

  const handleCellClick = (day: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const appointmentDateTime = new Date(day);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    openModal(null, appointmentDateTime);
  };

  return (
    <div className="bg-white rounded-lg shadow-soft border border-rose-100">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 border-b border-rose-100">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-rose-900">
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs px-3"
          >
            Hoje
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days header */}
          <div className="grid grid-cols-8 border-b border-rose-100">
            <div className="p-2 text-xs font-medium text-rose-600 bg-rose-50"></div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-3 text-center border-r border-rose-100 cursor-pointer hover:bg-rose-50",
                  isSameDay(day, selectedDate) && "bg-rose-100",
                  isSameDay(day, new Date()) && "bg-blue-50 text-blue-600 font-medium"
                )}
                onClick={() => onDateSelect(day)}
              >
                <div className="text-xs text-rose-600 font-medium">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={cn(
                  "text-lg font-semibold mt-1",
                  isSameDay(day, new Date()) ? "text-blue-600" : "text-rose-900"
                )}>
                  {format(day, 'd')}
                </div>
                {getAppointmentsForDay(day).length > 0 && (
                  <div className="w-2 h-2 bg-rose-400 rounded-full mx-auto mt-1"></div>
                )}
              </div>
            ))}
          </div>

          {/* Time slots and appointments */}
          <div className="relative">
            {timeSlots.map((timeSlot, timeIndex) => (
              <div key={timeSlot} className="grid grid-cols-8 border-b border-rose-50 relative">
                {/* Time label */}
                <div className="p-2 text-xs text-rose-600 bg-rose-50 border-r border-rose-100 flex items-center">
                  {timeSlot}
                </div>
                
                {/* Day cells */}
                {weekDays.map((day) => (
                  <div
                    key={`${day.toISOString()}-${timeSlot}`}
                    className="relative h-10 border-r border-rose-50 hover:bg-rose-25 cursor-pointer group"
                    onClick={() => handleCellClick(day, timeSlot)}
                  >
                    {/* Plus button on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4 text-rose-400" />
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Appointments overlay */}
            {weekDays.map((day) => {
              const dayAppointments = getAppointmentsForDay(day);
              const dayIndex = weekDays.indexOf(day) + 1; // +1 because first column is time labels
              
              return dayAppointments.map((appointment) => {
                const style = getAppointmentStyle(appointment);
                
                return (
                  <div
                    key={appointment.id}
                    className={cn(
                      "absolute border rounded-md p-1 cursor-pointer transition-all hover:shadow-md",
                      "text-xs overflow-hidden",
                      appointment.status === 'confirmed' ? "bg-green-100 border-green-300 text-green-800" :
                      appointment.status === 'pending' ? "bg-yellow-100 border-yellow-300 text-yellow-800" :
                      "bg-gray-100 border-gray-300 text-gray-600"
                    )}
                    style={{
                      ...style,
                      left: `${(dayIndex / 8) * 100}%`,
                      width: `${100 / 8}%`,
                      zIndex: 10
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick?.(appointment);
                    }}
                  >
                    <div className="font-medium truncate">
                      {appointment.client?.name || 'Cliente'}
                    </div>
                    <div className="truncate">
                      {appointment.service?.name || 'Serviço'}
                    </div>
                    <div className="text-xs opacity-75">
                      {formatCurrency(appointment.price)}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
