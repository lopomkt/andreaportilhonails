
import { useState, useCallback } from 'react';
import { Appointment, ServiceResponse, WhatsAppMessageData, AppointmentStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapDbAppointmentToApp, mapAppAppointmentToDb } from '@/integrations/supabase/mappers';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase.from("agendamentos_novo").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error deleting appointment:", err);
      return false;
    }
  };

  const refetchAppointments = useCallback(async () => {
    console.log("refetchAppointments called");
    return await fetchAppointments();
  }, []);

  const fetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    console.log("useAppointments: fetchAppointments called");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .order('data_inicio', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const mappedAppointments: Appointment[] = data.map(item => {
          // Safely handle potentially missing relations
          const clientData = item.clientes && !('error' in item.clientes) ? item.clientes : null;
          const serviceData = item.servicos && !('error' in item.servicos) ? item.servicos : null;
          
          // Explicitly map status values from database to AppointmentStatus enum
          let status: AppointmentStatus = "pending";
          if (item.status === 'confirmado') {
            status = "confirmed";
          } else if (item.status === 'cancelado') {
            status = "canceled";
          } else if (item.status === 'pendente') {
            status = "pending";
          }
          
          const appointmentData = mapDbAppointmentToApp(item, clientData, serviceData);
          return {
            ...appointmentData,
            status,
          };
        });
        
        console.log(`useAppointments: Fetched ${mappedAppointments.length} appointments`);
        setAppointments(mappedAppointments);
        return mappedAppointments;
      }
      
      return [];
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar agendamentos_novo';
      console.error("Error fetching appointments:", errorMessage);
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
      
      // Validate required fields
      if (!appointment.clientId || !appointment.serviceId || !appointment.date) {
        const errorMsg = 'Erro: Campos obrigatórios não preenchidos.';
        console.error("Missing required appointment fields:", errorMsg);
        toast({
          title: 'Campos obrigatórios',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
      // Format date to ISO string
      const formattedDate = appointment.date instanceof Date 
        ? appointment.date.toISOString() 
        : (typeof appointment.date === 'string' ? new Date(appointment.date).toISOString() : appointment.date);
      
      // Convert app model to database model
      const dbAppointmentData = mapAppAppointmentToDb({
        ...appointment,
        date: formattedDate
      });
      
      // Map status from application code to database value
      let dbStatus = 'pendente';
      if (appointment.status === 'confirmed') {
        dbStatus = 'confirmado';
      } else if (appointment.status === 'canceled') {
        dbStatus = 'cancelado';
      }
      
      // Create data object with required fields
      const dataToInsert = {
        cliente_id: dbAppointmentData.cliente_id,
        servico_id: dbAppointmentData.servico_id,
        data_inicio: dbAppointmentData.data_inicio,
        preco: dbAppointmentData.preco || 0,
        status: dbStatus,
        data_fim: dbAppointmentData.data_fim,
        observacoes: dbAppointmentData.observacoes || null,
        status_confirmacao: dbAppointmentData.status_confirmacao || 'not_confirmed',
        motivo_cancelamento: dbAppointmentData.motivo_cancelamento || null
      };
      
      console.log("Inserting appointment data:", dataToInsert);
      
      const { data: responseData, error } = await supabase
        .from('agendamentos_novo')
        .insert(dataToInsert)
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .single();
        
      if (error) {
        console.error("Supabase error creating appointment:", error);
        throw error;
      }
      
      if (responseData) {
        // Safely handle potentially missing relations
        const clientData = responseData.clientes && !('error' in responseData.clientes) 
          ? responseData.clientes : null;
        const serviceData = responseData.servicos && !('error' in responseData.servicos) 
          ? responseData.servicos : null;
          
        // Map status from database value to application code
        let appStatus: AppointmentStatus = "pending";
        if (responseData.status === 'confirmado') {
          appStatus = "confirmed"; 
        } else if (responseData.status === 'cancelado') {
          appStatus = "canceled";
        }
          
        const newAppointment = {
          ...mapDbAppointmentToApp(responseData, clientData, serviceData),
          status: appStatus
        };
        
        // Update local state
        setAppointments(prev => [...prev, newAppointment]);
        
        // Refresh appointments list
        await fetchAppointments();
        
        toast({
          title: 'Agendamento realizado com sucesso!',
          description: 'Agendamento cadastrado com sucesso'
        });
        
        return { data: newAppointment, success: true };
      }
      
      return { error: 'Falha ao criar agendamento', success: false };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao criar agendamento';
      console.error("Error creating appointment:", err);
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (id: string, appointmentData: Partial<Appointment>): Promise<ServiceResponse<Appointment>> => {
    try {
      setLoading(true);
      
      // Validate ID
      if (!id) {
        const errorMsg = 'ID do agendamento não fornecido';
        toast({
          title: 'Erro',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
      // Format date if provided
      if (appointmentData.date) {
        appointmentData.date = appointmentData.date instanceof Date 
          ? appointmentData.date.toISOString() 
          : (typeof appointmentData.date === 'string' ? new Date(appointmentData.date).toISOString() : appointmentData.date);
      }
      
      // Convert app model to database model
      const dbAppointmentData = mapAppAppointmentToDb(appointmentData);
      
      // Map status from application to database format
      let dbStatus;
      if (appointmentData.status === 'confirmed') {
        dbStatus = 'confirmado';
      } else if (appointmentData.status === 'canceled') {
        dbStatus = 'cancelado';
      } else if (appointmentData.status === 'pending') {
        dbStatus = 'pendente';
      } else if (dbAppointmentData.status) {
        dbStatus = dbAppointmentData.status;
      }
      
      // Only include fields that are actually provided
      const updateData: Record<string, any> = {};
      if (dbAppointmentData.cliente_id !== undefined) updateData.cliente_id = dbAppointmentData.cliente_id;
      if (dbAppointmentData.servico_id !== undefined) updateData.servico_id = dbAppointmentData.servico_id;
      if (dbAppointmentData.data_inicio !== undefined) updateData.data_inicio = dbAppointmentData.data_inicio;
      if (dbAppointmentData.preco !== undefined) updateData.preco = dbAppointmentData.preco;
      if (dbStatus !== undefined) updateData.status = dbStatus;
      if (dbAppointmentData.data_fim !== undefined) updateData.data_fim = dbAppointmentData.data_fim;
      if (dbAppointmentData.motivo_cancelamento !== undefined) updateData.motivo_cancelamento = dbAppointmentData.motivo_cancelamento;
      if (dbAppointmentData.observacoes !== undefined) updateData.observacoes = dbAppointmentData.observacoes;
      if (dbAppointmentData.status_confirmacao !== undefined) updateData.status_confirmacao = dbAppointmentData.status_confirmacao;
      
      const { data, error } = await supabase
        .from('agendamentos_novo')
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
        // Safely handle potentially missing relations
        const clientData = data.clientes && !('error' in data.clientes) ? data.clientes : null;
        const serviceData = data.servicos && !('error' in data.servicos) ? data.servicos : null;
        
        // Map status from database to app status
        let appStatus: AppointmentStatus = "pending";
        if (data.status === 'confirmado') {
          appStatus = "confirmed";
        } else if (data.status === 'cancelado') {
          appStatus = "canceled";
        }
        
        const updatedAppointment = {
          ...mapDbAppointmentToApp(data, clientData, serviceData),
          status: appStatus
        };
        
        setAppointments(prev => prev.map(appointment => appointment.id === id ? updatedAppointment : appointment));
        
        // Refresh appointments list after update
        await fetchAppointments();
        
        toast({
          title: 'Agendamento atualizado',
          description: 'Agendamento atualizado com sucesso'
        });
        
        return { data: updatedAppointment, success: true };
      }
      
      return { error: 'Falha ao atualizar agendamento', success: false };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao atualizar agendamento';
      console.error("Error updating appointment:", err);
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
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
    return getAppointmentsForDate(date)
      .filter(app => app.status === "confirmed")
      .reduce((total, appointment) => total + appointment.price, 0);
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

  const createAppointment = useCallback(async (appointmentData: {
    clienteId: string;
    servicoId: string;
    data: Date;
    horaFim: Date;
    preco: number;
    status: string;
    observacoes?: string;
  }) => {
    try {
      console.log("Enviando agendamento:", appointmentData);
      
      // Validate required fields
      if (!appointmentData.clienteId || !appointmentData.servicoId || !appointmentData.data) {
        const errorMsg = 'Cliente, serviço e data são obrigatórios';
        console.error("Missing required appointment fields:", errorMsg);
        return { success: false, error: { message: errorMsg } };
      }
      
      // Map status values from application to database
      let dbStatus = 'pendente';
      if (appointmentData.status === 'confirmed') {
        dbStatus = 'confirmado';
      } else if (appointmentData.status === 'canceled') {
        dbStatus = 'cancelado';
      } else if (appointmentData.status === 'pending') {
        dbStatus = 'pendente';
      }
      
      // Prepare data for new appointments table format
      const formattedData = {
        cliente_id: appointmentData.clienteId,
        servico_id: appointmentData.servicoId,
        data_inicio: appointmentData.data instanceof Date ? appointmentData.data.toISOString() : appointmentData.data,
        data_fim: appointmentData.horaFim instanceof Date ? appointmentData.horaFim.toISOString() : appointmentData.horaFim,
        preco: appointmentData.preco || 0,
        status: dbStatus,
        observacoes: appointmentData.observacoes || null
      };
      
      console.log("Formatted appointment data for Supabase:", formattedData);
      
      // Insert into the new table structure
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .insert(formattedData)
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .single();
      
      console.log("Resposta do Supabase:", { data, error });
        
      if (error) {
        console.error("Supabase error:", error);
        return { success: false, error: { message: error.message || 'Erro ao criar agendamento' } };
      }
      
      if (data) {
        console.log("Appointment created successfully:", data);
        
        // Map status from database to application value
        let appStatus: AppointmentStatus = "pending";
        if (data.status === 'confirmado') {
          appStatus = "confirmed";
        } else if (data.status === 'cancelado') {
          appStatus = "canceled";
        }
        
        const clientData = data.clientes && !('error' in data.clientes) ? data.clientes : null;
        const serviceData = data.servicos && !('error' in data.servicos) ? data.servicos : null;
        
        const newAppointment = {
          ...mapDbAppointmentToApp(data, clientData, serviceData),
          status: appStatus
        };
        
        setAppointments(prev => [...prev, newAppointment]);
        
        await fetchAppointments();
        
        return { success: true, data: newAppointment };
      }
      
      return { success: false, error: { message: 'Falha ao criar agendamento' } };
    } catch (err: any) {
      console.error("Erro inesperado em addAppointment:", err);
      return { success: false, error: { message: err?.message || 'Erro inesperado ao agendar' } };
    }
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refetchAppointments,
    getAppointmentsForDate,
    calculateDailyRevenue,
    generateWhatsAppLink,
    createAppointment
  };
}

export default useAppointments;
