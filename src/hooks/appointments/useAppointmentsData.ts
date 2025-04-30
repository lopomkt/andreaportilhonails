
import { useState, useCallback } from 'react';
import { Appointment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapDbAppointmentToApp } from '@/integrations/supabase/mappers';
import { useToast } from '@/hooks/use-toast';

export function useAppointmentsData() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    console.log("Fetching appointments...");
    setLoading(true);
    try {
      // Query the new appointments table
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .select(`
          *,
          clientes(*),
          servicos(*)
        `)
        .order('data_inicio', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        // Map the DB structure to app structure, handling the new column names
        const mappedAppointments = data.map(item => {
          // Extract data from the new structure but map to our app model
          const appAppointment = {
            ...item,
            id: item.id,
            clientId: item.cliente_id,
            serviceId: item.servico_id,
            date: item.data_inicio, // Use data_inicio as the appointment date
            endTime: item.data_fim,
            price: item.preco,
            status: item.status === 'pendente' ? 'pending' : 
                   item.status === 'confirmado' ? 'confirmed' : 
                   item.status === 'cancelado' ? 'canceled' : 'pending',
            notes: item.observacoes,
            client: item.clientes,
            service: item.servicos,
          };
          
          return appAppointment as unknown as Appointment;
        });
        
        console.log(`Fetched ${mappedAppointments.length} appointments from agendamentos_novo`);
        setAppointments(mappedAppointments);
        setError(null);
        return mappedAppointments;
      }
      
      return [];
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar agendamentos';
      console.error("Error fetching appointments:", errorMessage);
      setError(errorMessage);
      toast({
        title: 'Erro ao buscar agendamentos',
        description: errorMessage,
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    setAppointments
  };
}
