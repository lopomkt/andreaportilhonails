
import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, isSameDay, eachDayOfInterval, getWeekOfMonth, addWeeks, subWeeks, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Appointment } from '@/types';
import { useData } from '@/context/DataProvider';
import { AppointmentCard } from './day/AppointmentCard';
import { Badge } from '../ui/badge';

interface WeekViewProps {
  date: Date;
  onDaySelect: (date: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  date,
  onDaySelect
}) => {
  const { appointments, fetchAppointments } = useData();
  const isMobile = useIsMobile();
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const weekStart = startOfWeek(date, { locale: ptBR });
    return weekStart;
  });
  
  // Fetch fresh data when week view is shown
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, currentWeek]);

  // Navigate to previous week
  const handlePrevWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  // Navigate to next week
  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };
  
  const getWeekStats = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { locale: ptBR });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    // Fix for desktop: Ensure dates are properly normalized for comparison
    const normalizedAppointments = appointments.map(appt => ({
      ...appt,
      // Create a normalized date for accurate comparison
      normalizedDate: new Date(new Date(appt.date).setHours(0, 0, 0, 0))
    }));
    
    let totalAppointments = 0;
    let totalConfirmed = 0;
    let totalCanceled = 0;
    let totalRevenue = 0;
    let expectedRevenue = 0;
    
    daysInWeek.forEach(day => {
      // Normalize the day for comparison
      const normalizedDay = new Date(day);
      normalizedDay.setHours(0, 0, 0, 0);
      
      // Filter appointments for this day using the normalized date
      const dayAppointments = normalizedAppointments.filter(appt => {
        const apptDate = new Date(appt.normalizedDate);
        return isSameDay(apptDate, normalizedDay);
      });
      
      totalAppointments += dayAppointments.length;
      
      dayAppointments.forEach(appt => {
        if (appt.status === 'confirmed') {
          totalConfirmed++;
          totalRevenue += appt.price;
        } else if (appt.status === 'canceled') {
          totalCanceled++;
        } else {
          // Pending appointments count towards expected revenue
          expectedRevenue += appt.price;
        }
      });
    });
    
    // Add confirmed revenue to expected for total expected
    expectedRevenue += totalRevenue;
    
    return {
      totalAppointments,
      totalConfirmed,
      totalCanceled,
      totalRevenue,
      expectedRevenue,
      startDate: weekStart,
      endDate: weekEnd
    };
  };
  
  const handleWeekClick = (weekStart: Date) => {
    // Fix: Ensure the date is properly normalized to avoid timezone issues
    const normalizedDate = new Date(weekStart);
    normalizedDate.setHours(0, 0, 0, 0);
    
    if (isMobile) {
      setSelectedWeekStart(normalizedDate);
    } else {
      onDaySelect(normalizedDate);
    }
  };
  
  const renderWeekDetails = (weekStart: Date | null) => {
    if (!weekStart) return null;
    
    const weekEnd = endOfWeek(weekStart, { locale: ptBR });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return (
      <div className="space-y-3">
        {daysInWeek.map(day => {
          // Normalize the day for accurate comparison
          const normalizedDay = new Date(day);
          normalizedDay.setHours(0, 0, 0, 0);
          
          const dayAppointments = appointments.filter(appt => {
            // Normalize appointment date for comparison
            const apptDate = new Date(appt.date);
            apptDate.setHours(0, 0, 0, 0);
            return isSameDay(apptDate, normalizedDay);
          });
          
          return (
            <div key={day.toString()} className="border-b pb-3">
              <h3 className={cn(
                "font-medium mb-2",
                isToday(day) ? "text-primary" : ""
              )}>
                {format(day, 'EEEE, dd/MM', { locale: ptBR })}
              </h3>
              
              {dayAppointments.length > 0 ? (
                <div className="space-y-2">
                  {dayAppointments.map(appt => (
                    <AppointmentCard
                      key={appt.id}
                      appointment={appt}
                      compact={false}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum agendamento</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  const stats = getWeekStats(currentWeek);
  const weekNumber = getWeekOfMonth(currentWeek, { locale: ptBR });

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex justify-between items-center mx-[15px] my-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrevWeek}
          className="flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Semana anterior</span>
        </Button>
        
        <h3 className="text-lg font-medium">
          Semana {weekNumber} ({format(stats.startDate, 'dd/MM', { locale: ptBR })} a{' '}
          {format(stats.endDate, 'dd/MM', { locale: ptBR })})
        </h3>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNextWeek}
          className="flex items-center"
        >
          <span className="hidden md:inline">Próxima semana</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleWeekClick(currentWeek)}>
        <CardHeader className="pb-2 p-3 md:p-6">
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-primary" />
              {isMobile ? (
                <span className="text-lg">
                  S{weekNumber} ({format(stats.startDate, 'dd', { locale: ptBR })}–
                  {format(stats.endDate, 'dd/MM', { locale: ptBR })})
                </span>
              ) : (
                <span>
                  Semana {weekNumber} ({format(stats.startDate, 'dd', { locale: ptBR })} a{' '}
                  {format(stats.endDate, 'dd/MM', { locale: ptBR })})
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className={isMobile ? "p-3 pt-0" : ""}>
          {isMobile ? (
            <p className="text-base">
              {stats.totalAppointments} Agendados • {stats.totalRevenue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  <span>{stats.totalConfirmed} confirmados</span>
                </div>
                <div className="flex items-center text-sm">
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  <span>{stats.totalCanceled} cancelados</span>
                </div>
                <div className="flex items-center text-sm">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                  <span>{stats.totalAppointments - stats.totalConfirmed - stats.totalCanceled} pendentes</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Total agendamentos: {stats.totalAppointments}</p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  Receita confirmada: {stats.totalRevenue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Previsto: {stats.expectedRevenue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily break-down of the week */}
      <div className="mt-4 space-y-3">
        {eachDayOfInterval({ start: stats.startDate, end: stats.endDate }).map(day => {
          const normalizedDay = new Date(day);
          normalizedDay.setHours(0, 0, 0, 0);
          
          const dayAppointments = appointments.filter(appt => {
            const apptDate = new Date(appt.date);
            apptDate.setHours(0, 0, 0, 0);
            return isSameDay(apptDate, normalizedDay);
          });
          
          // Skip days with no appointments if not today
          if (dayAppointments.length === 0 && !isToday(day)) {
            return null;
          }
          
          return (
            <Card 
              key={day.toString()} 
              className={cn(
                "hover:border-primary cursor-pointer",
                isToday(day) ? "border-primary" : ""
              )}
              onClick={() => onDaySelect(day)}
            >
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium flex items-center">
                  <span className={isToday(day) ? "text-primary" : ""}>
                    {format(day, 'EEEE, dd/MM', { locale: ptBR })}
                  </span>
                  
                  {isToday(day) && (
                    <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                      Hoje
                    </Badge>
                  )}
                  
                  {dayAppointments.length > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {dayAppointments.length} agendamento{dayAppointments.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              {dayAppointments.length > 0 && (
                <CardContent className="py-2 px-4">
                  <div className="grid gap-2">
                    {dayAppointments
                      .filter(appt => appt.status !== 'canceled')
                      .slice(0, 3)
                      .map(appointment => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          compact={true}
                        />
                      ))}
                    
                    {dayAppointments.length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs justify-start px-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDaySelect(day);
                        }}
                      >
                        + {dayAppointments.length - 3} mais agendamentos...
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Week Details Modal */}
      <Dialog open={!!selectedWeekStart} onOpenChange={() => setSelectedWeekStart(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedWeekStart && `Detalhes da Semana ${format(selectedWeekStart, 'dd/MM', {
                locale: ptBR
              })}`}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-4 max-h-[60vh]">
            {selectedWeekStart && renderWeekDetails(selectedWeekStart)}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
