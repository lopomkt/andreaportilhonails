
import { useCallback } from 'react';
import { useDataContext } from './useDataContext';
import { useToast } from '@/hooks/use-toast';

export function useDataMutations() {
  const { 
    addAppointment, 
    updateAppointment,
    addExpense,
    deleteExpense,
    addService,
    updateService,
    deleteService,
    createClient,
    updateClient,
    deleteClient 
  } = useDataContext();
  const { toast } = useToast();

  const handleAppointmentAdd = useCallback(async (data: any) => {
    const result = await addAppointment(data);
    if (result.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
    return result;
  }, [addAppointment, toast]);

  const handleAppointmentUpdate = useCallback(async (id: string, data: any) => {
    const result = await updateAppointment(id, data);
    if (result.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
    return result;
  }, [updateAppointment, toast]);

  return {
    handleAppointmentAdd,
    handleAppointmentUpdate,
    addExpense,
    deleteExpense,
    addService,
    updateService,
    deleteService,
    createClient,
    updateClient,
    deleteClient,
  };
}
