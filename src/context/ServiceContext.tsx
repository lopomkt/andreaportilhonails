
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Service, Appointment } from "@/types";
import { useServiceContext as useServiceHook } from "@/hooks/useServiceContext";
import { supabase } from "@/integrations/supabase/client";
import { mapDbServiceToApp } from "@/integrations/supabase/mappers";
import { toast } from "@/hooks/use-toast";

interface ServiceContextType {
  services: Service[];
  loading: boolean;
  error: string | null;
  calculateServiceRevenue: (appointments: Appointment[], services: Service[]) => { name: string; value: number; count: number }[];
  addService: (service: Omit<Service, "id">) => Promise<any>;
  updateService: (id: string, data: Partial<Service>) => Promise<any>;
  deleteService: (id: string) => Promise<any>;
  fetchServices: () => Promise<Service[]>;
}

const ServiceContext = createContext<ServiceContextType>({
  services: [],
  loading: false,
  error: null,
  calculateServiceRevenue: () => [],
  addService: async () => ({}),
  updateService: async () => ({}),
  deleteService: async () => ({}),
  fetchServices: async () => [],
});

export const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Direct implementation of fetchServices for immediate use
  const fetchServices = useCallback(async (): Promise<Service[]> => {
    console.log("ServiceProvider: Iniciando busca direta de serviços");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const mappedServices: Service[] = data.map(item => mapDbServiceToApp({
          id: item.id,
          nome: item.nome,
          preco: item.preco,
          duracao_minutos: item.duracao_minutos,
          descricao: item.descricao || null
        }));
        
        console.log(`ServiceProvider: ${mappedServices.length} serviços carregados diretamente`);
        setServices(mappedServices);
        return mappedServices;
      }
      
      console.log("ServiceProvider: Nenhum serviço encontrado na busca direta");
      return [];
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar serviços';
      console.error("ServiceProvider: Erro na busca direta de serviços:", err);
      setError(errorMessage);
      toast({
        title: 'Erro ao buscar serviços',
        description: errorMessage,
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Complete service context with all needed methods
  const serviceContext = useServiceHook(setServices, services);

  // Automatically load services when the provider is mounted
  useEffect(() => {
    const loadInitialServices = async () => {
      console.log("ServiceProvider: Carregando serviços iniciais");
      await fetchServices();
    };
    
    loadInitialServices();
    
    // Set up a realtime listener for service changes
    const channel = supabase
      .channel('services-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'servicos' }, 
          () => {
            console.log("ServiceProvider: Mudança detectada na tabela de serviços, atualizando...");
            fetchServices().then(updatedServices => {
              console.log(`ServiceProvider: Serviços atualizados via realtime, ${updatedServices.length} serviços carregados`);
            });
          })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchServices]);

  return (
    <ServiceContext.Provider
      value={{
        services,
        loading,
        error,
        calculateServiceRevenue: serviceContext.calculateServiceRevenue,
        addService: serviceContext.addService,
        updateService: serviceContext.updateService,
        deleteService: serviceContext.deleteService,
        fetchServices,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
};
