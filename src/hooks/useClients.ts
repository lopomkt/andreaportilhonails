
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
        const mappedClients: Client[] = data.map(item => mapDbClientToApp({
          id: item.id,
          nome: item.nome,
          telefone: item.telefone,
          email: item.email || null,
          observacoes: item.observacoes || null,
          valor_total: item.valor_total || 0,
          data_nascimento: item.data_nascimento || null,
          ultimo_agendamento: item.ultimo_agendamento || null,
          data_criacao: item.data_criacao || null
        }));
        
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
      
      const dbClientData = mapAppClientToDb(clientData);
      const { data, error } = await supabase
        .from('clientes')
        .insert(dbClientData)
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
    updateClient,
    deleteClient,
    getTopClients
  };
}
