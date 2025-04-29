
import { useState, useCallback, useEffect } from 'react';
import { Service, Appointment, ServiceResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapDbServiceToApp, mapAppServiceToDb } from '@/integrations/supabase/mappers';
import { useToast } from './use-toast';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchServices = useCallback(async (): Promise<Service[]> => {
    console.log("useServices: Iniciando busca de serviços");
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
        
        console.log(`useServices: ${mappedServices.length} serviços encontrados:`, mappedServices);
        setServices(mappedServices);
        return mappedServices;
      }
      
      console.log("useServices: Nenhum serviço encontrado");
      return [];
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar serviços';
      console.error("useServices: Erro na busca de serviços:", err);
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

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const addService = async (service: Omit<Service, "id">): Promise<ServiceResponse<Service>> => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!service.name || service.price === undefined || !service.durationMinutes) {
        const errorMsg = 'Nome, preço e duração são obrigatórios';
        toast({
          title: 'Erro',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
      const { data, error } = await supabase
        .from('servicos')
        .insert({
          nome: service.name,
          preco: service.price,
          duracao_minutos: service.durationMinutes,
          descricao: service.description || null
        })
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const newService = mapDbServiceToApp(data);
        setServices(prev => [...prev, newService]);
        
        toast({
          title: 'Serviço adicionado',
          description: 'Serviço adicionado com sucesso'
        });
        
        return { data: newService, success: true };
      }
      
      return { error: 'Falha ao adicionar serviço', success: false };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao adicionar serviço';
      console.error("Error adding service:", err);
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateService = async (id: string, serviceData: Partial<Service>): Promise<ServiceResponse<Service>> => {
    try {
      setLoading(true);
      
      // Validate required fields if they're being updated
      if ((serviceData.name !== undefined && !serviceData.name) || 
          (serviceData.price !== undefined && serviceData.price < 0) ||
          (serviceData.durationMinutes !== undefined && serviceData.durationMinutes <= 0)) {
        const errorMsg = 'Dados inválidos para atualização';
        toast({
          title: 'Erro',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
      const dbServiceData = mapAppServiceToDb(serviceData);
      const { data, error } = await supabase
        .from('servicos')
        .update(dbServiceData)
        .eq('id', id)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const updatedService = mapDbServiceToApp(data);
        setServices(prev => prev.map(service => service.id === id ? updatedService : service));
        
        toast({
          title: 'Serviço atualizado',
          description: 'Serviço atualizado com sucesso'
        });
        
        return { data: updatedService, success: true };
      }
      
      return { error: 'Falha ao atualizar serviço', success: false };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao atualizar serviço';
      console.error("Error updating service:", err);
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id: string): Promise<ServiceResponse<boolean>> => {
    try {
      if (!id) {
        const errorMsg = 'ID do serviço não fornecido';
        toast({
          title: 'Erro',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
      setLoading(true);
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setServices(prev => prev.filter(service => service.id !== id));
      
      toast({
        title: 'Serviço excluído',
        description: 'Serviço excluído com sucesso'
      });
      
      return { data: true, success: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao excluir serviço';
      console.error("Error deleting service:", err);
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    } finally {
      setLoading(false);
    }
  };

  const calculateServiceRevenue = useCallback((appointments: Appointment[], servicesList: Service[]) => {
    const serviceRevenueMap: { [key: string]: { name: string; value: number; count: number } } = {};

    appointments.forEach((appointment) => {
      if (!serviceRevenueMap[appointment.serviceId]) {
        const service = servicesList.find((s) => s.id === appointment.serviceId);
        serviceRevenueMap[appointment.serviceId] = {
          name: service?.name || "Unknown",
          value: 0,
          count: 0,
        };
      }
      serviceRevenueMap[appointment.serviceId].value += appointment.price;
      serviceRevenueMap[appointment.serviceId].count += 1;
    });

    return Object.values(serviceRevenueMap).sort((a, b) => b.value - a.value);
  }, []);

  return {
    services,
    loading,
    error,
    fetchServices,
    addService,
    updateService,
    deleteService,
    calculateServiceRevenue
  };
}
