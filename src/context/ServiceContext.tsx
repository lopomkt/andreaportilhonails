
import React, { createContext, useContext, useState, useEffect } from "react";
import { Service, Appointment } from "@/types";
import { useServiceContext as useServiceHook } from "@/hooks/useServiceContext";
import { supabase } from "@/integrations/supabase/client";
import { mapDbServiceToApp } from "@/integrations/supabase/mappers";

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
  const serviceContext = useServiceHook(setServices, services);

  // Automatically load services when the provider is mounted
  useEffect(() => {
    const loadInitialServices = async () => {
      console.log("ServiceProvider: Carregando serviços iniciais");
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
          
          console.log(`ServiceProvider: ${mappedServices.length} serviços carregados inicialmente`);
          setServices(mappedServices);
        }
      } catch (err: any) {
        console.error("ServiceProvider: Erro ao carregar serviços iniciais:", err);
        setError(err?.message || "Erro ao carregar serviços");
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialServices();
    
    // Set up a realtime listener for service changes
    const channel = supabase
      .channel('services-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'servicos' }, 
          () => {
            console.log("ServiceProvider: Mudança detectada na tabela de serviços, atualizando...");
            serviceContext.fetchServices().then(updatedServices => {
              console.log(`ServiceProvider: Serviços atualizados via realtime, ${updatedServices.length} serviços carregados`);
            });
          })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [serviceContext.fetchServices]);

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
        fetchServices: serviceContext.fetchServices,
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
