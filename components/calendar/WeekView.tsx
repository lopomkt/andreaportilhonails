
import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, eachDayOfInterval, getWeekOfMonth, addWeeks, subWeeks, addMonths, subMonths, isSameMonth, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WeekViewProps {
  date: Date;
  onDaySelect: (date: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  date,
  onDaySelect
}) => {
  const {
    appointments
  } = useSupabaseData();
  const isMobile = useIsMobile();
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(date.getFullYear(), date.getMonth(), 1));
  
  // Generate all weeks of the month
  const getWeeksOfMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const firstWeekStart = startOfWeek(monthStart, { locale: ptBR });
    
    // Calculate how many weeks to display
    const totalDays = differenceInDays(monthEnd, firstWeekStart) + 1;
    const numWeeks = Math.ceil(totalDays / 7);
    
    const weeks = [];
    let currentWeekStart = firstWeekStart;
    
    for (let i = 0; i < numWeeks; i++) {
      weeks.push(currentWeekStart);
      currentWeekStart = addWeeks(currentWeekStart, 1);
    }
    
    return weeks;
  };
  
  const weeksInMonth = getWeeksOfMonth(currentMonth);
  
  const getWeekStats = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, {
      locale: ptBR
    });
    const daysInWeek = eachDayOfInterval({
      start: weekStart,
      end: weekEnd
    });
    let totalAppointments = 0;
    let totalConfirmed = 0;
    let totalCanceled = 0;
    let totalRevenue = 0;
    let expectedRevenue = 0;
    daysInWeek.forEach(day => {
      const dayAppointments = appointments.filter(appt => isSameDay(new Date(appt.date), day));
      totalAppointments += dayAppointments.length;
      dayAppointments.forEach(appt => {
        if (appt.status === 'confirmed') {
          totalConfirmed++;
          totalRevenue += appt.price;
        } else if (appt.status === 'canceled') {
          totalCanceled++;
        }
        expectedRevenue += appt.price;
      });
    });
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
    if (isMobile) {
      setSelectedWeekStart(weekStart);
    } else {
      onDaySelect(weekStart);
    }
  };
  
  const navigateToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  const navigateToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  return <div className="space-y-4">
      <div className="flex justify-between items-center mb-3 mx-[15px]">
        <h2 className="text-lg font-bold md:text-2xl">
          {format(currentMonth, 'MMM yyyy', { locale: ptBR })}
        </h2>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={navigateToPreviousMonth} className="h-8 w-8 border-rose-200">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={navigateToNextMonth} className="h-8 w-8 border-rose-200">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {weeksInMonth.map((weekStart, index) => {
          const stats = getWeekStats(weekStart);
          const weekEnd = stats.endDate;
          const weekNumber = getWeekOfMonth(weekStart, { locale: ptBR });
          const isCurrentMonthWeek = isSameMonth(weekStart, currentMonth) || isSameMonth(weekEnd, currentMonth);
          
          // Skip weeks that don't belong to the current month at all
          if (!isCurrentMonthWeek) return null;
          
          return (
            <Card 
              key={weekStart.toISOString()} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleWeekClick(weekStart)}
            >
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="flex items-center justify-between text-base md:text-lg">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-primary" />
                    {isMobile ? <span className="text-lg">
                        S{weekNumber} ({format(weekStart, 'dd', {
                      locale: ptBR
                    })}–{format(weekEnd, 'dd/MM', {
                      locale: ptBR
                    })})
                      </span> : <span>Semana {weekNumber} ({format(weekStart, 'dd', {
                      locale: ptBR
                    })} a {format(weekEnd, 'dd/MM', {
                      locale: ptBR
                    })})</span>}
                  </div>
                  
                  {!isMobile && <Button variant="ghost" size="sm" className="h-7 px-2 text-primary" onClick={e => {
                  e.stopPropagation();
                  onDaySelect(weekStart);
                }}>
                      <span className="text-xs mr-1">Detalhar</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>}
                </CardTitle>
              </CardHeader>
              
              <CardContent className={isMobile ? "p-3 pt-0" : ""}>
                {isMobile ? <p className="text-base">
                    {stats.totalAppointments} Agendados • {stats.totalRevenue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
                  </p> : <div className="grid grid-cols-2 gap-4">
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
                  </div>}
              </CardContent>
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
            {selectedWeekStart && <div className="space-y-3">
                {eachDayOfInterval({
              start: selectedWeekStart,
              end: endOfWeek(selectedWeekStart, {
                locale: ptBR
              })
            }).map(day => {
              const dayAppointments = appointments.filter(appt => isSameDay(new Date(appt.date), day));
              return <div key={day.toString()} className="border-b pb-3">
                      <h3 className="font-medium mb-2">
                        {format(day, 'EEEE, dd/MM', {
                    locale: ptBR
                  })}
                      </h3>
                      {dayAppointments.length > 0 ? <div className="space-y-2">
                          {dayAppointments.map(appt => <div key={appt.id} className="flex justify-between items-center p-2 bg-accent/10 rounded-md">
                              <div>
                                <p className="font-medium">{appt.client?.name}</p>
                                <p className="text-sm text-muted-foreground">{appt.service?.name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={appt.status === 'confirmed' ? 'success' : appt.status === 'pending' ? 'warning' : 'destructive'}>
                                  {appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {appt.price.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                                </span>
                              </div>
                            </div>)}
                        </div> : <p className="text-sm text-muted-foreground">Nenhum agendamento</p>}
                    </div>;
            })}
              </div>}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>;
};
