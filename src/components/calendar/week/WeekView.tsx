
import React, { useState } from 'react';
import { useData } from "@/context/DataProvider";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, differenceInDays, getWeekOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { WeekStats } from './WeekStats';

interface WeekViewProps {
  date: Date;
  onDaySelect: (date: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  date,
  onDaySelect
}) => {
  const { appointments } = useData();
  const isMobile = useIsMobile();

const getWeekStats = (weekStart: Date) => {
  const weekEnd = endOfWeek(weekStart, { locale: ptBR });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  let totalAppointments = 0;
  let totalConfirmed = 0;
  let totalCanceled = 0;
  let totalRevenue = 0;
  let expectedRevenue = 0;

  daysInWeek.forEach(day => {
    const dayAppointments = appointments.filter(appt =>
      isSameDay(new Date(appt.date), day)
    );

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
    endDate: weekEnd
  };
};


  const weekStats = getWeekStats(startOfWeek(date, { locale: ptBR }));
  const weekNumber = getWeekOfMonth(date, { locale: ptBR });

  return (
    <div className="space-y-4">
      <Card className="cursor-pointer hover:border-primary transition-colors">
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
                  onDaySelect(weekStats.startDate);
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
    </div>
  );
};
