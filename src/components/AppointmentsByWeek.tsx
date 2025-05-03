
import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/types';
import { normalizeDate } from '@/lib/dateUtils';

interface AppointmentsByWeekProps {
  appointments: Appointment[];
  onClick?: () => void;
}

export const AppointmentsByWeek = ({ appointments, onClick }: AppointmentsByWeekProps) => {
  const today = new Date();
  const startDate = startOfWeek(today, { locale: ptBR });
  const endDate = endOfWeek(today, { locale: ptBR });
  
  const { count, total } = useMemo(() => {
    const weekAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      const appointmentDateNormalized = normalizeDate(appointmentDate);
      const startDateNormalized = normalizeDate(startDate);
      const endDateNormalized = normalizeDate(endDate);
      
      return isWithinInterval(appointmentDateNormalized, {
        start: startDateNormalized,
        end: endDateNormalized
      });
    });
    
    const confirmedWeekAppointments = weekAppointments.filter(
      appointment => appointment.status === 'confirmed'
    );
    
    const totalValue = confirmedWeekAppointments.reduce(
      (sum, appointment) => sum + appointment.price, 0
    );
    
    return {
      count: weekAppointments.length,
      total: totalValue
    };
  }, [appointments, startDate, endDate]);
  
  return (
    <Card 
      className={`bg-white border-rose-100 shadow-soft ${onClick ? 'cursor-pointer hover:scale-[1.01] transition-transform' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-rose-500" />
            <h3 className="font-medium">Agenda da Semana</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {format(startDate, "dd 'de' MMMM", { locale: ptBR })} - {format(endDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
          <div className="mt-2">
            <p className="text-2xl font-bold">{count} agendamentos</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium text-green-600">
            {total.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            receita confirmada
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
