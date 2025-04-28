
import { useCallback } from 'react';
import { Appointment, ServiceResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useDataContext } from './useDataContext';

export function useAppointmentOperations() {
  const { appointments, refetchAppointments } = useDataContext();
  const { toast } = useToast();

  const getAppointmentsForDate = useCallback((date: Date): Appointment[] => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      );
    });
  }, [appointments]);

  const calculateDailyRevenue = useCallback((date: Date): number => {
    return getAppointmentsForDate(date).reduce(
      (total, appointment) => total + appointment.price,
      0
    );
  }, [getAppointmentsForDate]);

  const refetchAppointmentsData = useCallback(async (): Promise<void> => {
    console.log("DataContext: refetchAppointments called");
    await refetchAppointments();
  }, [refetchAppointments]);

import { useCallback } from 'react';
import { useDataContext } from './useDataContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase'; // Certifique-se que o supabase está importado!

export function useAppointmentOperations() {
  const { appointments, refetchAppointments } = useDataContext();
  const { toast } = useToast();

  // Função nova para criar agendamento no Supabase
  const createAppointment = useCallback(async (appointmentData: {
    clienteId: string;
    servicoId: string;
    data: Date;
    horaFim: Date;
    preco: number;
    status?: string;
    observacoes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .insert([{
          cliente_id: appointmentData.clienteId,
          servico_id: appointmentData.servicoId,
          data: appointmentData.data.toISOString(),
          hora_fim: appointmentData.horaFim.toISOString(),
          preco: appointmentData.preco,
          status: appointmentData.status || 'confirmado', // Valor padrão
          observacoes: appointmentData.observacoes || null,
        }]);

      if (error) {
        console.error("Erro ao criar agendamento:", error);
        toast({ title: "Erro", description: "Não foi possível criar o agendamento.", variant: "destructive" });
        return { success: false, error };
      }

      toast({ title: "Sucesso", description: "Agendamento criado com sucesso!" });
      await refetchAppointments(); // Atualizar a lista no CRM
      return { success: true, data };
      
    } catch (err: any) {
      console.error("Erro inesperado:", err);
      toast({ title: "Erro", description: "Erro inesperado ao criar agendamento.", variant: "destructive" });
      return { success: false, error: err };
    }
  }, [refetchAppointments]);

  // Outras funções já existentes
  const getAppointmentsForDate = useCallback((date: Date) => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      );
    });
  }, [appointments]);

  const calculateDailyRevenue = useCallback((date: Date) => {
    return getAppointmentsForDate(date).reduce(
      (total, appointment) => total + appointment.price,
      0
    );
  }, [getAppointmentsForDate]);

  const refetchAppointmentsData = useCallback(async (): Promise<void> => {
    console.log("DataContext: refetchAppointments called");
    await refetchAppointments();
  }, [refetchAppointments]);

  return {
    getAppointmentsForDate,
    calculateDailyRevenue,
    refetchAppointments: refetchAppointmentsData,
    createAppointment, // <<<< AGORA RETORNANDO TAMBÉM ESSA FUNÇÃO
  };
}
