
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';
import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

// Helper function to safely check responses
const isValidResponse = <T extends unknown>(response: { data: T | null; error: any } | null): response is { data: T; error: null } => {
  return response !== null && response.data !== null && !response.error;
};

export const useClientContext = (
  setClients: React.Dispatch<React.SetStateAction<Client[]>>,
  refetchAppointments: () => Promise<void>,
  clients: Client[]
) => {
  const fetchClients = async () => {
    try {
      const response = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      
      if (!isValidResponse(response)) {
        console.error('Error fetching clients:', response?.error);
        toast({
          title: 'Erro ao carregar clientes',
          description: 'Ocorreu um erro ao carregar a lista de clientes.',
          variant: 'destructive',
        });
        return [];
      }
      
      const mappedClients: Client[] = response.data.map(item => ({
        id: item.id,
        name: item.nome || 'Sem nome',
        phone: item.telefone || 'Não informado',
        email: item.email || '',
        notes: item.observacoes || '',
        totalSpent: item.valor_total || 0,
        birthdate: item.data_nascimento || null,
        lastAppointment: item.ultimo_agendamento || null,
        createdAt: item.data_criacao || null
      }));
      
      setClients(mappedClients);
      return mappedClients;
    } catch (error) {
      console.error('Unexpected error fetching clients:', error);
      toast({
        title: 'Erro ao carregar clientes',
        description: 'Ocorreu um erro inesperado ao carregar os clientes.',
        variant: 'destructive',
      });
      return [];
    }
  };

  const createClient = useCallback(async (clientData: any) => {
    try {
      const response = await supabase
        .from('clientes')
        .insert([clientData])
        .select()
        .single();

      if (!isValidResponse(response)) {
        console.error('Error creating client:', response?.error);
        toast({
          title: 'Erro ao criar cliente',
          description: 'Ocorreu um erro ao criar o cliente. Por favor, tente novamente.',
          variant: 'destructive',
        });
        return { success: false, error: response?.error };
      }

      const newClient: Client = {
        id: response.data.id,
        name: response.data.nome,
        phone: response.data.telefone,
        email: response.data.email || '',
        notes: response.data.observacoes || '',
        totalSpent: response.data.valor_total || 0,
        birthdate: response.data.data_nascimento || null,
        lastAppointment: response.data.ultimo_agendamento || null,
        createdAt: response.data.data_criacao || null
      };

      setClients(prev => [...prev, newClient]);
      
      if (response && typeof response === 'object') {
        return { 
          success: true, 
          data: response.data
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Erro ao criar cliente',
        description: 'Ocorreu um erro ao criar o cliente. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  }, [setClients]);

  const updateClient = useCallback(async (clientId: string, clientData: any) => {
    try {
      const response = await supabase
        .from('clientes')
        .update(clientData)
        .eq('id', clientId)
        .select()
        .single();

      if (!isValidResponse(response)) {
        console.error('Error updating client:', response?.error);
        toast({
          title: 'Erro ao atualizar cliente',
          description: 'Ocorreu um erro ao atualizar o cliente. Por favor, tente novamente.',
          variant: 'destructive',
        });
        return { success: false, error: response?.error };
      }

      setClients(prev =>
        prev.map(client => client.id === clientId ? { ...client, ...response.data } : client)
      );

      if (response && typeof response === 'object') {
        return { 
          success: true, 
          data: response.data
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: 'Erro ao atualizar cliente',
        description: 'Ocorreu um erro ao atualizar o cliente. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  }, [setClients]);

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;
      
      // Refresh clients after deletion
      await fetchClients();
      await refetchAppointments(); // Refresh appointments in case any were tied to this client
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error);
      return { success: false, error };
    }
  };

  const getTopClients = useCallback((limit: number): Client[] => {
    const sortedClients = [...clients].sort(
      (a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)
    );
    return sortedClients.slice(0, limit);
  }, [clients]);

  return {
    fetchClients,
    createClient: useCallback(async (clientData: any) => {
      try {
        const response = await supabase
          .from('clientes')
          .insert([clientData])
          .select()
          .single();
  
        if (!isValidResponse(response)) {
          console.error('Error creating client:', response?.error);
          toast({
            title: 'Erro ao criar cliente',
            description: 'Ocorreu um erro ao criar o cliente. Por favor, tente novamente.',
            variant: 'destructive',
          });
          return { success: false, error: response?.error };
        }
  
        const newClient: Client = {
          id: response.data.id,
          name: response.data.nome,
          phone: response.data.telefone,
          email: response.data.email || '',
          notes: response.data.observacoes || '',
          totalSpent: response.data.valor_total || 0,
          birthdate: response.data.data_nascimento || null,
          lastAppointment: response.data.ultimo_agendamento || null,
          createdAt: response.data.data_criacao || null
        };
  
        setClients(prev => [...prev, newClient]);
        
        if (response && typeof response === 'object') {
          return { 
            success: true, 
            data: response.data
          };
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error creating client:', error);
        toast({
          title: 'Erro ao criar cliente',
          description: 'Ocorreu um erro ao criar o cliente. Por favor, tente novamente.',
          variant: 'destructive',
        });
        return { success: false, error };
      }
    }, [setClients]),
    updateClient: useCallback(async (clientId: string, clientData: any) => {
      try {
        const response = await supabase
          .from('clientes')
          .update(clientData)
          .eq('id', clientId)
          .select()
          .single();
  
        if (!isValidResponse(response)) {
          console.error('Error updating client:', response?.error);
          toast({
            title: 'Erro ao atualizar cliente',
            description: 'Ocorreu um erro ao atualizar o cliente. Por favor, tente novamente.',
            variant: 'destructive',
          });
          return { success: false, error: response?.error };
        }
  
        setClients(prev =>
          prev.map(client => client.id === clientId ? { ...client, ...response.data } : client)
        );
  
        if (response && typeof response === 'object') {
          return { 
            success: true, 
            data: response.data
          };
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error updating client:', error);
        toast({
          title: 'Erro ao atualizar cliente',
          description: 'Ocorreu um erro ao atualizar o cliente. Por favor, tente novamente.',
          variant: 'destructive',
        });
        return { success: false, error };
      }
    }, [setClients]),
    deleteClient,
    getTopClients
  };
};
