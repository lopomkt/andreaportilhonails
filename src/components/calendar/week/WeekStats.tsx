
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Appointment } from '@/types';

interface WeekStatsProps {
  appointments: Appointment[];
  totalAppointments: number;
  totalConfirmed: number;
  totalCanceled: number;
  totalRevenue: number;
  expectedRevenue: number;
  isMobile: boolean;
}

export const WeekStats: React.FC<WeekStatsProps> = ({
  appointments,
  totalAppointments,
  totalConfirmed,
  totalCanceled,
  totalRevenue,
  expectedRevenue,
  isMobile
}) => {
  // Calculate pending appointments
  const totalPending = totalAppointments - totalConfirmed - totalCanceled;
  
  if (isMobile) {
    return (
      <p className="text-base text-rose-500">
        {totalAppointments} Agendados • {totalRevenue.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        })}
      </p>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-2">
      <div>
        <p className="text-sm font-medium">Total agendamentos: {totalAppointments}</p>
        <p className="text-sm text-green-600 font-medium mt-1">
          Receita confirmada: {totalRevenue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })}
        </p>
      </div>
    </div>
  );
};
