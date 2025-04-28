
import { useState, useCallback } from 'react';
import { Appointment, ServiceResponse, WhatsAppMessageData } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapDbAppointmentToApp, mapAppAppointmentToDb } from '@/integrations/supabase/mappers';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
      
      // Convert app model to database model
      const dbAppointmentData = mapAppAppointmentToDb(appointment);
      
      // Make sure required fields are present
      if (!dbAppointmentData.cliente_id || !dbAppointmentData.servico_id || !dbAppointmentData.data) {
        throw new Error('Cliente, serviço e data são obrigatórios');
      }
      
      // Convert Date objects to ISO strings for Supabase
      const data = typeof appointment.date === 'string' 
        ? appointment.date 
        : appointment.date.toISOString();
      
      const hora_fim = appointment.endTime 
        ? (typeof appointment.endTime === 'string' 
           ? appointment.endTime 
           : appointment.endTime.toISOString()) 
        : null;
      
      // Create data object with required fields
      const dataToInsert = {
        cliente_id: dbAppointmentData.cliente_id,
        servico_id: dbAppointmentData.servico_id,
        data: data,
        preco: dbAppointmentData.preco || 0,
        status: dbAppointmentData.status || 'pendente',
        hora_fim: hora_fim,
        motivo_cancelamento: dbAppointmentData.motivo_cancelamento || null,
        observacoes: dbAppointmentData.observacoes || null,
        status_confirmacao: dbAppointmentData.status_confirmacao || 'not_confirmed'
      };
      
      const { data: responseData, error } = await supabase
        .from('agendamentos')
        .insert(dataToInsert as any) // Type assertion to bypass Supabase's strict typing
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
        const newAppointment = mapDbAppointmentToApp(responseData, responseData.clientes, responseData.servicos);
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

  const updateAppointment = async (id: string, appointmentData: Partial<Appointment>): Promise<ServiceResponse<Appointment>> => {
    try {
      setLoading(true);
      
      // Convert app model to database model
      const dbAppointmentData = mapAppAppointmentToDb(appointmentData);
      
      // Only include fields that are actually provided
      const updateData: Record<string, any> = {};
      if (dbAppointmentData.cliente_id !== undefined) updateData.cliente_id = dbAppointmentData.cliente_id;
      if (dbAppointmentData.servico_id !== undefined) updateData.servico_id = dbAppointmentData.servico_id;
      if (dbAppointmentData.data !== undefined) updateData.data = dbAppointmentData.data;
      if (dbAppointmentData.preco !== undefined) updateData.preco = dbAppointmentData.preco;
      if (dbAppointmentData.status !== undefined) updateData.status = dbAppointmentData.status;
      if (dbAppointmentData.hora_fim !== undefined) updateData.hora_fim = dbAppointmentData.hora_fim;
      if (dbAppointmentData.motivo_cancelamento !== undefined) updateData.motivo_cancelamento = dbAppointmentData.motivo_cancelamento;
      if (dbAppointmentData.observacoes !== undefined) updateData.observacoes = dbAppointmentData.observacoes;
      if (dbAppointmentData.status_confirmacao !== undefined) updateData.status_confirmacao = dbAppointmentData.status_confirmacao;
      
      const { data, error } = await supabase
        .from('agendamentos')
        .update(updateData)
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
      
      if (data) {
        const updatedAppointment = mapDbAppointmentToApp(data, data.clientes, data.servicos);
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
    appointment
  }: WhatsAppMessageData): Promise<string> => {
    if (!client || !client.phone) {
      return "";
    }
    
    let messageText = message || "";
    
    if (!messageText && appointment) {
      const appointmentDate = new Date(appointment.date);
      const serviceType = appointment.service?.name || "serviço";
      
      messageText = `Olá ${client.name}, confirmando seu agendamento de ${serviceType} para o dia ${format(appointmentDate, 'dd/MM/yyyy')} às ${format(appointmentDate, 'HH:mm')}.`;
    }
    
    const encodedMessage = encodeURIComponent(messageText);
    return `https://wa.me/${client.phone}?text=${encodedMessage}`;
  };

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    addAppointment,
    updateAppointment,
    getAppointmentsForDate,
    calculateDailyRevenue,
    generateWhatsAppLink
  };
}
