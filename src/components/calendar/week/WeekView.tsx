
import React, { useState, useMemo } from 'react';
import { useData } from "@/context/DataProvider";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, differenceInDays, getWeekOfMonth, addMonths, startOfMonth, endOfMonth, setMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, Filter } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { WeekStats } from './WeekStats';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
import { formatCurrency } from '@/lib/formatters';
import { EditAppointmentModal } from '@/components/EditAppointmentModal';
import { Appointment } from '@/types';

interface WeekViewProps {
  date: Date;
  onDaySelect: (date: Date) => void;
}

// Month names in Portuguese (abbreviated)
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const WeekView: React.FC<WeekViewProps> = ({
  date,
  onDaySelect
}) => {
  const { appointments, refetchAppointments } = useData();
  const isMobile = useIsMobile();
  const { openModal } = useAppointmentsModal();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(date.getMonth());
  const [isWeekDialogOpen, setIsWeekDialogOpen] = useState<boolean>(false);
  const [selectedWeekAppointments, setSelectedWeekAppointments] = useState<any[]>([]);
  const [selectedWeekDates, setSelectedWeekDates] = useState<{ start: Date, end: Date } | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const getWeekStats = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { locale: ptBR });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    let totalAppointments = 0;
    let totalConfirmed = 0;
    let totalCanceled = 0;
    let totalRevenue = 0;
    let expectedRevenue = 0;
    let weekAppointments: any[] = [];

    daysInWeek.forEach(day => {
      const dayAppointments = appointments.filter(appt =>
        isSameDay(new Date(appt.date), day)
      );

      weekAppointments = [...weekAppointments, ...dayAppointments];
      
      totalAppointments += dayAppointments.length;

      dayAppointments.forEach(appt => {
        if (appt.status === 'confirmed') {
          totalConfirmed++;
          totalRevenue += appt.price || 0;
        } else if (appt.status === 'canceled') {
          totalCanceled++;
        }
        expectedRevenue += appt.price || 0;
      });
    });

    return {
      totalAppointments,
      totalConfirmed,
      totalCanceled,
      totalRevenue,
      expectedRevenue,
      startDate: weekStart,
      endDate: weekEnd,
      appointments: weekAppointments
    };
  };

  const handleOpenWeekDetails = (weekStart: Date) => {
    const stats = getWeekStats(weekStart);
    setSelectedWeekAppointments(stats.appointments);
    setSelectedWeekDates({ start: stats.startDate, end: stats.endDate });
    setIsWeekDialogOpen(true);
  };

  const handleAppointmentClick = (appointment: any) => {
    setEditingAppointment(appointment);
    setIsWeekDialogOpen(false);
  };

  // Updated handleMonthChange to maintain week view
  const handleMonthChange = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    
    // Update the current date to the selected month but keep the day
    const newDate = new Date(date);
    newDate.setMonth(monthIndex);
    newDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    
    // If the day doesn't exist in the new month, set to last day of month
    const maxDaysInMonth = new Date(date.getFullYear(), monthIndex + 1, 0).getDate();
    if (date.getDate() > maxDaysInMonth) {
      newDate.setDate(maxDaysInMonth);
    }
    
    // Set view mode to week and notify parent
    localStorage.setItem('calendarViewMode', 'week');
    onDaySelect(newDate);
  };

  // Get start of selected month for filtering
  const filteredMonth = useMemo(() => {
    return new Date(date.getFullYear(), selectedMonth, 1, 12, 0, 0, 0);
  }, [selectedMonth, date]);

  // Fixed week generation to avoid duplication
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(filteredMonth);
    const monthEnd = endOfMonth(filteredMonth);
    
    // Get the first day of the first week that contains a day of the month
    const firstWeekStart = startOfWeek(monthStart, { locale: ptBR });
    
    // Track processed week start times to avoid duplication
    const processedWeekStartTimes = new Set<number>();
    const result = [];
    
    // Start with the first week and go through at most 6 weeks
    for (let i = 0; i < 6; i++) {
      // Safely calculate the start of the current week
      const currentWeekStart = i === 0 ? 
        firstWeekStart : 
        new Date(firstWeekStart.getFullYear(), firstWeekStart.getMonth(), firstWeekStart.getDate() + (7 * i), 12, 0, 0);
      
      // Calculate the end of the week
      const weekEnd = endOfWeek(currentWeekStart, { locale: ptBR });
      
      // Check if we've gone past the end of the month
      if (currentWeekStart > monthEnd) break;
      
      // Generate days in the current week
      const daysInWeek = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
      
      // Check if at least one day in the week belongs to the current month
      const hasCurrentMonthDay = daysInWeek.some(day => isSameMonth(day, filteredMonth));
      
      if (!hasCurrentMonthDay) continue;
      
      // Use the timestamp as a unique identifier
      const weekStartTimestamp = currentWeekStart.getTime();
      
      // Skip if we've already processed this week
      if (processedWeekStartTimes.has(weekStartTimestamp)) continue;
      
      // Add this week's timestamp to our set of processed weeks
      processedWeekStartTimes.add(weekStartTimestamp);
      
      // Format date range for display
      const startMonth = currentWeekStart.getMonth();
      const endMonth = weekEnd.getMonth();
      let weekTitle = '';
      
      if (startMonth === endMonth) {
        // Same month for the week
        weekTitle = `${format(currentWeekStart, "d")} - ${format(weekEnd, "d")} ${MONTH_NAMES[startMonth]}`;
      } else {
        // Week spans two months
        weekTitle = `${format(currentWeekStart, "d")} ${MONTH_NAMES[startMonth]} - ${format(weekEnd, "d")} ${MONTH_NAMES[endMonth]}`;
      }
      
      // Get statistics for the week
      const stats = getWeekStats(currentWeekStart);
      
      result.push({
        start: currentWeekStart,
        end: weekEnd,
        title: weekTitle,
        weekNumber: getWeekOfMonth(currentWeekStart),
        stats
      });
    }
    
    return result;
  }, [filteredMonth, appointments]);

  // Fixed function to properly handle day view navigation
  const handleViewDay = (weekStart: Date) => {
    console.log("Switching to day view from week:", weekStart);
    if (onDaySelect) {
      // Create a normalized date with noon time to avoid timezone issues
      const normalizedDate = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate(),
        12, 0, 0, 0 // Set to noon (12:00) to avoid timezone issues
      );
      
      // Close the dialog and save view mode preference
      setIsWeekDialogOpen(false);
      localStorage.setItem('calendarViewMode', 'day');
      
      // Trigger day selection with normalized date
      onDaySelect(normalizedDate);
    }
  };

  // Fixed function to format date range without duplicating month names
  const formatDateRange = (startDate: Date, endDate: Date) => {
    // Check if start and end dates are in the same month
    if (startDate.getMonth() === endDate.getMonth()) {
      // Same month - just show the month name once
      return `${format(startDate, 'dd', { locale: ptBR })} a ${format(endDate, 'dd/MM', { locale: ptBR })}`;
    } else {
      // Different months - show both months
      return `${format(startDate, 'dd/MM', { locale: ptBR })} a ${format(endDate, 'dd/MM', { locale: ptBR })}`;
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center pb-4">
        <h3 className="text-lg font-medium">Semanas de {MONTH_NAMES[selectedMonth]}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MONTH_NAMES.map((month, index) => (
              <DropdownMenuItem 
                key={index}
                onClick={() => handleMonthChange(index)}
                className={selectedMonth === index ? "bg-primary/10" : ""}
              >
                {month}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {weeks.map((week, index) => {
          const weekStats = week.stats;
          const weekNumber = week.weekNumber;
          const weekEnd = weekStats.endDate;
          
          return (
            <Card 
              key={index} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleOpenWeekDetails(week.start)}
            >
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="flex items-center justify-between text-base md:text-lg">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-primary" />
                    {isMobile ? (
                      <span className="text-lg">
                        S{weekNumber} ({formatDateRange(weekStats.startDate, weekStats.endDate)})
                      </span>
                    ) : (
                      <span>
                        Semana {weekNumber} ({formatDateRange(weekStats.startDate, weekStats.endDate)})
                      </span>
                    )}
                  </div>

                  {!isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Updated to call the new function
                        handleViewDay(week.start);
                      }}
                    >
                      <span className="text-xs mr-1">Detalhar</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className={isMobile ? "p-3 pt-0" : ""}>
                {weekStats.totalAppointments > 0 ? (
                  <WeekStats
                    appointments={appointments}
                    totalAppointments={weekStats.totalAppointments}
                    totalConfirmed={weekStats.totalConfirmed}
                    totalCanceled={weekStats.totalCanceled}
                    totalRevenue={weekStats.totalRevenue}
                    expectedRevenue={weekStats.expectedRevenue}
                    isMobile={isMobile}
                  />
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    Nenhum agendamento encontrado para esta semana.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Week Appointments Dialog */}
      <Dialog open={isWeekDialogOpen} onOpenChange={setIsWeekDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedWeekDates && (
                <>
                  Agendamentos da Semana ({formatDateRange(selectedWeekDates.start, selectedWeekDates.end)})
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {selectedWeekAppointments.length > 0 ? (
              <div className="space-y-3">
                {selectedWeekAppointments.map((appointment) => (
                  <Card 
                    key={appointment.id}
                    className="cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <CardContent className="p-4">
                      <div className="grid gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{appointment.client?.name || "Cliente não definido"}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            appointment.status === 'canceled' ? 'bg-red-100 text-red-800' : 
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {appointment.status === 'confirmed' ? 'Confirmado' : 
                             appointment.status === 'canceled' ? 'Cancelado' : 'Pendente'}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {appointment.service?.name || "Serviço não definido"}
                        </div>
                        
                        <div className="text-sm mt-2 flex justify-between">
                          <span>
                            {format(new Date(appointment.date), 'dd/MM/yyyy')} às {format(new Date(appointment.date), 'HH:mm')}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(appointment.price)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento nesta semana.
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setIsWeekDialogOpen(false)}>
              Fechar
            </Button>
            
            {selectedWeekDates && (
              <Button 
                variant="default" 
                onClick={() => {
                  setIsWeekDialogOpen(false);
                  
                  // Create a normalized date with noon time to avoid timezone issues
                  const normalizedDate = new Date(
                    selectedWeekDates.start.getFullYear(),
                    selectedWeekDates.start.getMonth(),
                    selectedWeekDates.start.getDate(),
                    12, 0, 0, 0
                  );
                  
                  // Save view mode preference
                  localStorage.setItem('calendarViewMode', 'day');
                  
                  // Trigger day selection with normalized date
                  onDaySelect(normalizedDate);
                }}
              >
                Ver dia completo
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
};
