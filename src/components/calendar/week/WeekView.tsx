import React, { useState } from 'react';
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
  const { appointments } = useData();
  const isMobile = useIsMobile();
  const { openModal } = useAppointmentsModal();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(date.getMonth());
  const [isWeekDialogOpen, setIsWeekDialogOpen] = useState<boolean>(false);
  const [selectedWeekAppointments, setSelectedWeekAppointments] = useState<any[]>([]);
  const [selectedWeekDates, setSelectedWeekDates] = useState<{ start: Date, end: Date } | null>(null);

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
    openModal(appointment);
    setIsWeekDialogOpen(false);
  };

  const handleMonthChange = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    
    // Update the current date to the selected month but keep the day
    const newDate = new Date(date);
    newDate.setMonth(monthIndex);
    
    // If the day doesn't exist in the new month, set to last day of month
    const maxDaysInMonth = new Date(date.getFullYear(), monthIndex + 1, 0).getDate();
    if (date.getDate() > maxDaysInMonth) {
      newDate.setDate(maxDaysInMonth);
    }
    
    onDaySelect(newDate);
  };

  // Get start of selected month
  const monthStart = startOfMonth(setMonth(new Date(), selectedMonth));
  const monthEnd = endOfMonth(setMonth(new Date(), selectedMonth));
  
  // Generate all weeks in the selected month
  const firstWeekStart = startOfWeek(monthStart, { locale: ptBR });
  const lastWeekStart = startOfWeek(monthEnd, { locale: ptBR });
  
  // Calculate number of weeks between first and last week
  const weeksCount = Math.ceil(differenceInDays(lastWeekStart, firstWeekStart) / 7) + 1;
  
  const weeks = [];
  for (let i = 0; i < weeksCount; i++) {
    const weekStart = addMonths(firstWeekStart, 0);
    weekStart.setDate(firstWeekStart.getDate() + (i * 7));
    
    // Only add the week if at least one day is in the selected month
    const weekEnd = endOfWeek(weekStart, { locale: ptBR });
    const hasOverlap = datesOverlap(weekStart, weekEnd, monthStart, monthEnd);
    
    if (hasOverlap) {
      weeks.push(weekStart);
    }
  }

  function datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date) {
    return start1 <= end2 && end1 >= start2;
  }

  const weekNumber = getWeekOfMonth(date, { locale: ptBR });

  return (
    <div className="space-y-4">
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
      
      {weeks.map((weekStart, index) => {
        const weekStats = getWeekStats(weekStart);
        const weekNumber = getWeekOfMonth(weekStart, { locale: ptBR });
        
        return (
          <Card 
            key={index} 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleOpenWeekDetails(weekStart)}
          >
            <CardHeader className="pb-2 p-3 md:p-6">
              <CardTitle className="flex items-center justify-between text-base md:text-lg">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-primary" />
                  {isMobile ? (
                    <span className="text-lg">
                      S{weekNumber} ({format(weekStats.startDate, 'dd', { locale: ptBR })}–
                      {format(weekStats.endDate, 'dd/MM', { locale: ptBR })})
                    </span>
                  ) : (
                    <span>
                      Semana {weekNumber} ({format(weekStats.startDate, 'dd', { locale: ptBR })} a{' '}
                      {format(weekStats.endDate, 'dd/MM', { locale: ptBR })})
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
                      handleOpenWeekDetails(weekStart);
                    }}
                  >
                    <span className="text-xs mr-1">Detalhar</span>
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className={isMobile ? "p-3 pt-0" : ""}>
              <WeekStats
                appointments={appointments}
                totalAppointments={weekStats.totalAppointments}
                totalConfirmed={weekStats.totalConfirmed}
                totalCanceled={weekStats.totalCanceled}
                totalRevenue={weekStats.totalRevenue}
                expectedRevenue={weekStats.expectedRevenue}
                isMobile={isMobile}
              />
            </CardContent>
          </Card>
        );
      })}

      {/* Week Appointments Dialog */}
      <Dialog open={isWeekDialogOpen} onOpenChange={setIsWeekDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedWeekDates && (
                <>
                  Agendamentos da Semana ({format(selectedWeekDates.start, 'dd/MM', { locale: ptBR })} a{' '}
                  {format(selectedWeekDates.end, 'dd/MM', { locale: ptBR })})
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
        </DialogContent>
      </Dialog>
    </div>
  );
};
