import { useState, useCallback } from 'react';
import { Appointment, Client, Service, AppointmentStatus, ServiceResponse, WhatsAppMessageData } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapDbAppointmentToApp, mapAppAppointmentToDb } from '@/integrations/supabase/mappers';
import { useToast } from './use-toast';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .order('data', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const mappedAppointments: Appointment[] = data.map(item => {
          const client = item.clientes ? {
            id: item.clientes.id,
            name: item.clientes.nome,
            phone: item.clientes.telefone,
            email: item.clientes.email || undefined,
            notes: item.clientes.observacoes || undefined,
            lastAppointment: item.clientes.ultimo_agendamento || undefined,
            totalSpent: Number(item.clientes.valor_total || 0),
            createdAt: item.clientes.data_criacao || undefined
          } : undefined;
          
          const service = item.servicos ? {
            id: item.servicos.id,
            name: item.servicos.nome,
            price: Number(item.servicos.preco),
            durationMinutes: item.servicos.duracao_minutos,
            description: item.servicos.descricao || undefined
          } : undefined;
          
          return mapDbAppointmentToApp(item, item.clientes, item.servicos);
        });
        
        setAppointments(mappedAppointments);
        return mappedAppointments;
      }
      
      return [];
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar agendamentos';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addAppointment = async (appointment: Omit<Appointment, "id">): Promise<ServiceResponse<Appointment>> => {
    try {
      setLoading(true);
      
      const dbAppointmentData = mapAppAppointmentToDb(appointment);
      
      if (!dbAppointmentData.cliente_id || !dbAppointmentData.servico_id || !dbAppointmentData.data) {
        throw new Error('Cliente, serviço e data são obrigatórios');
      }
      
      const dataToInsert = {
        cliente_id: dbAppointmentData.cliente_id,
        servico_id: dbAppointmentData.servico_id,
        data: dbAppointmentData.data,
        preco: dbAppointmentData.preco || 0,
        status: dbAppointmentData.status || 'pendente',
        hora_fim: dbAppointmentData.hora_fim || null,
        motivo_cancelamento: dbAppointmentData.motivo_cancelamento || null,
        observacoes: dbAppointmentData.observacoes || null
      };
      
      const { data, error } = await supabase
        .from('agendamentos')
        .insert(dataToInsert)
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const newAppointment = mapDbAppointmentToApp(data, data.clientes, data.servicos);
        setAppointments(prev => [...prev, newAppointment]);
        
        toast({
          title: 'Agendamento criado',
          description: 'Agendamento cadastrado com sucesso'
        });
        
        return { data: newAppointment };
      }
      
      return { error: 'Falha ao criar agendamento' };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao criar agendamento';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>): Promise<ServiceResponse<Appointment>> => {
    try {
      setLoading(true);
      
      const dbAppointmentData = mapAppAppointmentToDb(data);
      const { data: responseData, error } = await supabase
        .from('agendamentos')
        .update(dbAppointmentData)
        .eq('id', id)
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (responseData) {
        const updatedAppointment = mapDbAppointmentToApp(responseData, responseData.clientes, responseData.servicos);
        setAppointments(prev => prev.map(appointment => appointment.id === id ? updatedAppointment : appointment));
        
        toast({
          title: 'Agendamento atualizado',
          description: 'Agendamento atualizado com sucesso'
        });
        
        return { data: updatedAppointment };
      }
      
      return { error: 'Falha ao atualizar agendamento' };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao atualizar agendamento';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

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

  const generateWhatsAppLink = async ({
    client,
    message,
  }: WhatsAppMessageData): Promise<string> => {
    const encodedMessage = encodeURIComponent(message || "");
    return `https://wa.me/${client?.phone}?text=${encodedMessage}`;
  };

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    addAppointment,
    updateAppointment: async () => ({ error: "Not implemented" }),
    getAppointmentsForDate: () => [],
    calculateDailyRevenue: () => 0,
    generateWhatsAppLink: async () => ""
  };
}
