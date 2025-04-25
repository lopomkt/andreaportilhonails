
import { useState, useCallback } from 'react';
import { Client } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchClientsFromApi, 
  createClientInApi, 
  updateClientInApi, 
  deleteClientInApi 
} from '@/services/clientApi';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClients = useCallback(async (): Promise<Client[]> => {
    setLoading(true);
    try {
      console.log("Fetching clients from API...");
      const fetchedClients = await fetchClientsFromApi();
      console.log("Clients fetched successfully:", fetchedClients);
      setClients(fetchedClients);
      return fetchedClients;
    } catch (err: any) {
      console.error("Error in fetchClients:", err);
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

  const createClient = async (clientData: Partial<Client>) => {
    try {
      setLoading(true);
      console.log("Creating client with data:", clientData);
      
      const result = await createClientInApi(clientData);
      
      if (result.error) {
        console.error("Error in createClient:", result.error);
        throw new Error(result.error);
      }

      if (result.data) {
        console.log("Client created successfully:", result.data);
        setClients(prev => [...prev, result.data!]);
        toast({
          title: 'Cliente cadastrado',
          description: 'Cliente cadastrado com sucesso!'
        });
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao criar cliente';
      console.error("Client creation failed:", errorMessage);
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

  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    try {
      setLoading(true);
      const result = await updateClientInApi(clientId, clientData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data) {
        setClients(prev => prev.map(client => 
          client.id === clientId ? result.data! : client
        ));
        toast({
          title: 'Cliente atualizado',
          description: 'Cliente atualizado com sucesso'
        });
      }
      
      return result;
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

  const deleteClient = async (clientId: string) => {
    try {
      setLoading(true);
      const result = await deleteClientInApi(clientId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setClients(prev => prev.filter(client => client.id !== clientId));
      toast({
        title: 'Cliente excluído',
        description: 'Cliente excluído com sucesso'
      });
      
      return result;
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
