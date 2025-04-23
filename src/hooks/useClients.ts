
import { useState, useEffect, useCallback } from 'react';
import { Client, UseClientsReturnType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export function useClients(): UseClientsReturnType {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    if (process.env.NODE_ENV === "development") {
      console.log("useClients: fetchClients chamado");
    }
    try {
      const { data, error } = await supabase.from('clientes').select('*');
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error("Dados inválidos");
      
      // Map the Supabase database fields to our Client interface fields
      const mappedClients: Client[] = data.map(item => ({
        id: item.id,
        name: item.nome,
        phone: item.telefone,
        email: item.email || '',
        birthdate: item.data_nascimento || undefined,
        notes: item.observacoes || '',
        lastAppointment: item.ultimo_agendamento || undefined,
        totalSpent: item.valor_total || 0,
        createdAt: item.data_criacao || undefined
      }));
      
      setClients(mappedClients);
      if (process.env.NODE_ENV === "development") {
        console.log("useClients: dados recebidos", data);
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar clientes");
      setClients([]);
      if (process.env.NODE_ENV === "development") {
        console.error("useClients: erro:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const createClient = useCallback(async (clientData: any) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nome: clientData.name,
          telefone: clientData.phone,
          email: clientData.email || null,
          observacoes: clientData.notes || null,
          data_nascimento: clientData.birthdate || null
        }])
        .select();

      if (error) throw error;
      
      // Removed fetchClients() call from here to avoid duplicate fetching
      return { success: true, data };
    } catch (err: any) {
      console.error("Error creating client:", err);
      return { success: false, error: err };
    }
  }, []);

  const updateClient = useCallback(async (clientId: string, clientData: any) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update({
          nome: clientData.name,
          telefone: clientData.phone,
          email: clientData.email || null,
          observacoes: clientData.notes || null,
          data_nascimento: clientData.birthdate || null
        })
        .eq('id', clientId)
        .select();

      if (error) throw error;
      
      // Removed fetchClients() call from here to avoid duplicate fetching
      return { success: true, data };
    } catch (err: any) {
      console.error("Error updating client:", err);
      return { success: false, error: err };
    }
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      
      // Removed fetchClients() call from here to avoid duplicate fetching
      return { success: true };
    } catch (err: any) {
      console.error("Error deleting client:", err);
      return { success: false, error: err };
    }
  }, []);

  const getTopClients = useCallback((limit: number): Client[] => {
    const sortedClients = [...clients].sort(
      (a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)
    );
    return sortedClients.slice(0, limit);
  }, [clients]);

  // Single useEffect with no dependencies to avoid infinite loops
  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    fetchClients,
    refetchClients: fetchClients, // Using fetchClients as refetchClients for consistency
    createClient,
    updateClient,
    deleteClient,
    getTopClients
  };
}
