
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
  if (isMobile) {
    return (
      <p className="text-base">
        {totalAppointments} Agendados • {totalRevenue.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        })}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
          <span>{totalConfirmed} confirmados</span>
        </div>
        <div className="flex items-center text-sm">
          <XCircle className="h-4 w-4 mr-2 text-red-500" />
          <span>{totalCanceled} cancelados</span>
        </div>
        <div className="flex items-center text-sm">
          <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
          <span>{totalAppointments - totalConfirmed - totalCanceled} pendentes</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium">Total agendamentos: {totalAppointments}</p>
        <p className="text-sm text-green-600 font-medium mt-1">
          Receita confirmada: {totalRevenue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Previsto: {expectedRevenue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })}
        </p>
      </div>
    </div>
  );
};
