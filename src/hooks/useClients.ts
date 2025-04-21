import { useState, useCallback } from 'react';
import { Client, ServiceResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapDbClientToApp, mapAppClientToDb } from '@/integrations/supabase/mappers';
import { useToast } from './use-toast';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper functions to validate responses
  const isValidResponse = <T extends unknown>(response: { data: T | null; error: any } | null): response is { data: T; error: null } => {
    return response !== null && response.data !== null && !response.error;
  };

  const isValidResult = <T extends unknown>(result: T | null): result is T => {
    return result !== null && typeof result === 'object';
  };

  const fetchClients = useCallback(async (): Promise<Client[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) {
        throw error;
      }

      if (data) {
        const mappedClients: Client[] = data.map(item => {
          // Ensure all required fields are present
          return mapDbClientToApp({
            id: item.id,
            nome: item.nome,
            telefone: item.telefone,
            email: item.email || null,
            observacoes: item.observacoes || null,
            valor_total: item.valor_total || 0,
            data_nascimento: item.data_nascimento || null,
            ultimo_agendamento: item.ultimo_agendamento || null,
            data_criacao: item.data_criacao || null,
            data_ultimo_agendamento: item.data_ultimo_agendamento || item.ultimo_agendamento || null
          });
        });
        
        setClients(mappedClients);
        return mappedClients;
      }
      return [];
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar clientes';
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

  const createClient = async (clientData: Partial<Client>): Promise<ServiceResponse<Client>> => {
    try {
      setLoading(true);
      
      // Make sure required fields are present
      if (!clientData.name || !clientData.phone) {
        throw new Error('Nome e telefone são obrigatórios');
      }
      
      // Convert Client to database format
      const dbClientData = mapAppClientToDb(clientData);
      
      // Ensure required fields for database
      const dataToInsert = {
        nome: dbClientData.nome,
        telefone: dbClientData.telefone,
        email: dbClientData.email || null,
        observacoes: dbClientData.observacoes || null,
        data_nascimento: dbClientData.data_nascimento || null,
        valor_total: dbClientData.valor_total || 0,
        data_criacao: dbClientData.data_criacao || new Date().toISOString(),
        ultimo_agendamento: dbClientData.ultimo_agendamento || null,
        data_ultimo_agendamento: dbClientData.ultimo_agendamento || null
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
        const newClient = mapDbClientToApp(data);
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
      
      const dbClientData = mapAppClientToDb(clientData);
      const { data, error } = await supabase
        .from('clientes')
        .update(dbClientData)
        .eq('id', clientId)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const updatedClient = mapDbClientToApp(data);
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
    updateClient: async () => ({ error: "Not implemented" }),
    deleteClient: async () => ({ error: "Not implemented" }),
    getTopClients
  };
}
