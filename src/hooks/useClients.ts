
import { useState, useCallback } from 'react';
import { Client, ServiceResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper function to validate responses
  const isValidResponse = <T extends unknown>(response: { data: T | null; error: any } | null): response is { data: T; error: null } => {
    return response !== null && response.data !== null && !response.error;
  };

  const fetchClients = useCallback(async (): Promise<Client[]> => {
    setLoading(true);
    console.log("useClients: fetchClients called");
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) {
        console.error("useClients: Error fetching clients:", error);
        throw error;
      }

      // IMPORTANTE: fallback defensivo aprimorado para garantir integridade dos dados
      if (!data || !Array.isArray(data)) {
        console.warn("useClients: Data from API is not an array or is null:", data);
        setClients([]);
        return [];
      }

      console.log("useClients: Client data from Supabase:", data);
      const mappedClients: Client[] = data.map(item => {
        return {
          id: item.id,
          name: item.nome || '',
          phone: item.telefone || '',
          email: item.email || '',
          notes: item.observacoes || '',
          totalSpent: item.valor_total || 0,
          birthdate: item.data_nascimento || null,
          lastAppointment: item.ultimo_agendamento || null,
          createdAt: item.data_criacao || null
        };
      });
      
      // Atualizar o state com os clientes mapeados
      setClients(mappedClients);
      console.log("useClients: State updated with clients:", mappedClients.length);
      return mappedClients;
    } catch (err: any) {
      console.error("Error in fetchClients:", err);
      const errorMessage = err?.message || 'Erro ao buscar clientes';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      setClients([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createClient = async (clientData: Partial<Client>): Promise<ServiceResponse<Client>> => {
    try {
      setLoading(true);
      
      // Make sure required fields are present
      if (!clientData.name || !clientData.phone) {
        throw new Error('Nome e telefone são obrigatórios');
      }
      
      // Prepare the data for insert to match database schema requirements
      const dataToInsert = {
        nome: clientData.name,
        telefone: clientData.phone,
        email: clientData.email || null,
        observacoes: clientData.notes || null,
        data_nascimento: clientData.birthdate || null,
        valor_total: clientData.totalSpent || 0,
        data_criacao: new Date().toISOString(),
        ultimo_agendamento: clientData.lastAppointment || null,
        data_ultimo_agendamento: clientData.lastAppointment || null
      };
      
      const { data, error } = await supabase
        .from('clientes')
        .insert(dataToInsert)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const newClient: Client = {
          id: data.id,
          name: data.nome,
          phone: data.telefone,
          email: data.email || '',
          notes: data.observacoes || '',
          totalSpent: data.valor_total || 0,
          birthdate: data.data_nascimento || null,
          lastAppointment: data.ultimo_agendamento || null,
          createdAt: data.data_criacao || null
        };
        
        setClients(prev => [...prev, newClient]);
        
        toast({
          title: 'Cliente criado',
          description: 'Cliente cadastrado com sucesso'
        });
        
        return { data: newClient };
      }
      
      return { error: 'Falha ao criar cliente' };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao criar cliente';
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

  const updateClient = async (clientId: string, clientData: Partial<Client>): Promise<ServiceResponse<Client>> => {
    try {
      setLoading(true);
      
      // Prepare the data for update
      const updateData: Record<string, any> = {};
      
      if (clientData.name !== undefined) updateData.nome = clientData.name;
      if (clientData.phone !== undefined) updateData.telefone = clientData.phone;
      if (clientData.email !== undefined) updateData.email = clientData.email;
      if (clientData.notes !== undefined) updateData.observacoes = clientData.notes;
      if (clientData.birthdate !== undefined) updateData.data_nascimento = clientData.birthdate;
      if (clientData.totalSpent !== undefined) updateData.valor_total = clientData.totalSpent;
      if (clientData.lastAppointment !== undefined) {
        updateData.ultimo_agendamento = clientData.lastAppointment;
        updateData.data_ultimo_agendamento = clientData.lastAppointment;
      }
      
      const { data, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', clientId)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const updatedClient: Client = {
          id: data.id,
          name: data.nome,
          phone: data.telefone,
          email: data.email || '',
          notes: data.observacoes || '',
          totalSpent: data.valor_total || 0,
          birthdate: data.data_nascimento || null,
          lastAppointment: data.ultimo_agendamento || null,
          createdAt: data.data_criacao || null
        };
        
        setClients(prev => prev.map(client => client.id === clientId ? updatedClient : client));
        
        toast({
          title: 'Cliente atualizado',
          description: 'Cliente atualizado com sucesso'
        });
        
        return { data: updatedClient };
      }
      
      return { error: 'Falha ao atualizar cliente' };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao atualizar cliente';
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

  const deleteClient = async (clientId: string): Promise<ServiceResponse<boolean>> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clientId);
        
      if (error) {
        throw error;
      }
      
      setClients(prev => prev.filter(client => client.id !== clientId));
      
      toast({
        title: 'Cliente excluído',
        description: 'Cliente excluído com sucesso'
      });
      
      return { data: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao excluir cliente';
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

  const getTopClients = useCallback((limit: number = 5): Client[] => {
    return [...clients].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)).slice(0, limit);
  }, [clients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getTopClients
  };
}
