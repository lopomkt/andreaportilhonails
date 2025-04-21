
import { useState, useEffect, useCallback } from 'react';
import { Client } from '@/types';
import { useSupabaseData } from './useSupabaseData';

export function useClients() {
  const { clients, fetchClients } = useSupabaseData();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [view, setView] = useState<"all" | "inactive">("all");
  
  // Apply filters whenever clients, searchTerm or view changes
  useEffect(() => {
    let filtered = clients || [];
    
    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        client.phone?.includes(searchTerm)
      );
    }

    if (view === "inactive") {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 40);
      filtered = filtered.filter(client => {
        return !client.lastAppointment || new Date(client.lastAppointment) < cutoffDate;
      });
    }
    
    setFilteredClients(filtered);
  }, [clients, searchTerm, view]);

  // Get inactive clients
  const getInactiveClients = useCallback(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 40);
    
    return (clients || []).filter(client => 
      !client.lastAppointment || new Date(client.lastAppointment) < cutoffDate
    );
  }, [clients]);

  // Get top clients by total spent
  const getTopClients = useCallback((limit: number = 5): Client[] => {
    return [...(clients || [])]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }, [clients]);

  return {
    clients,
    filteredClients,
    searchTerm,
    setSearchTerm,
    view,
    setView,
    refetchClients: fetchClients,
    getInactiveClients,
    getTopClients
  };
}
