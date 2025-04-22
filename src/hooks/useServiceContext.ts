
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Service } from '@/types';
import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export const useServiceContext = (
  setServices: React.Dispatch<React.SetStateAction<Service[]>>,
  services: Service[]
) => {
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) {
        console.error('Error fetching services:', error);
        return [];
      }
      
      const mappedServices: Service[] = data?.map(item => ({
        id: item.id,
        name: item.nome,
        price: item.preco,
        durationMinutes: item.duracao_minutos,
        description: item.descricao
      })) || [];
      
      setServices(mappedServices);
      return mappedServices;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  };

  const calculateServiceRevenue = useCallback(
    (appointments: Appointment[], services: Service[]) => {
      const serviceRevenueMap: { [key: string]: { name: string; value: number; count: number } } = {};

      appointments.forEach((appointment) => {
        if (!serviceRevenueMap[appointment.serviceId]) {
          const service = services.find((s) => s.id === appointment.serviceId);
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
    },
    []
  );

  const addService = useCallback(async (service: Omit<Service, "id">) => {
    try {
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

      if (error || !data) {
        console.error('Error adding service:', error);
        toast({
          title: 'Erro ao adicionar serviço',
          description: 'Ocorreu um erro ao adicionar o serviço. Por favor, tente novamente.',
          variant: 'destructive',
        });
        return null;
      }
      
      const newService: Service = {
        id: data.id,
        name: data.nome,
        price: data.preco,
        durationMinutes: data.duracao_minutos,
        description: data.descricao
      };
      
      setServices(prev => [...prev, newService]);
      
      toast({
        title: 'Serviço adicionado',
        description: 'Serviço adicionado com sucesso!',
      });
      
      return newService;
    } catch (error) {
      console.error('Error adding service:', error);
      toast({
        title: 'Erro ao adicionar serviço',
        description: 'Ocorreu um erro ao adicionar o serviço. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  }, [setServices]);

  const updateService = useCallback(async (id: string, data: Partial<Service>) => {
    try {
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.nome = data.name;
      if (data.price !== undefined) updateData.preco = data.price;
      if (data.durationMinutes !== undefined) updateData.duracao_minutos = data.durationMinutes;
      if (data.description !== undefined) updateData.descricao = data.description;
      
      const { error } = await supabase
        .from('servicos')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating service:', error);
        toast({
          title: 'Erro ao atualizar serviço',
          description: 'Ocorreu um erro ao atualizar o serviço. Por favor, tente novamente.',
          variant: 'destructive',
        });
        return false;
      }
      
      setServices(prev => 
        prev.map(service => service.id === id ? { ...service, ...data } : service)
      );
      
      toast({
        title: 'Serviço atualizado',
        description: 'Serviço atualizado com sucesso!',
      });
      
      return true;
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: 'Erro ao atualizar serviço',
        description: 'Ocorreu um erro ao atualizar o serviço. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [setServices]);

  const deleteService = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting service:', error);
        toast({
          title: 'Erro ao excluir serviço',
          description: 'Ocorreu um erro ao excluir o serviço. Por favor, tente novamente.',
          variant: 'destructive',
        });
        return false;
      }
      
      setServices(prev => prev.filter(service => service.id !== id));
      
      toast({
        title: 'Serviço excluído',
        description: 'Serviço excluído com sucesso!',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Erro ao excluir serviço',
        description: 'Ocorreu um erro ao excluir o serviço. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [setServices]);

  return {
    fetchServices,
    calculateServiceRevenue,
    addService,
    updateService,
    deleteService
  };
};
