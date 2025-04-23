
import { useState, useEffect } from 'react';
import { Client, UseClientsReturnType } from '@/types';
import { supabase } from '@/integrations/supabase/client';

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
      setClients(data as Client[]);
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

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    clients,
    loading,
    error,
    refetchClients: fetchClients,
  };
}
