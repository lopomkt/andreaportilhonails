
import { useCallback, useMemo } from 'react';
import { useOptimizedQueries } from './useOptimizedQueries';
import { useMemoizedCalculations } from './useMemoizedCalculations';
import { appointmentService } from '@/integrations/supabase/appointmentService';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Client, Service, Expense, BlockedDate } from '@/types';

export const useOptimizedDataProvider = () => {
  // Optimized appointment queries
  const appointmentQuery = useOptimizedQueries(
    () => appointmentService.getAll(),
    'appointments',
    { cacheTime: 5 * 60 * 1000, staleTime: 2 * 60 * 1000 }
  );

  // Optimized client queries
  const clientQuery = useOptimizedQueries(
    async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      
      return data?.map(item => ({
        id: item.id,
        name: item.nome || 'Sem nome',
        phone: item.telefone || 'Não informado',
        email: item.email || '',
        notes: item.observacoes || '',
        totalSpent: item.valor_total || 0,
        birthdate: item.data_nascimento || null,
        lastAppointment: item.ultimo_agendamento || null,
        createdAt: item.data_criacao || null
      })) as Client[] || [];
    },
    'clients',
    { cacheTime: 10 * 60 * 1000, staleTime: 5 * 60 * 1000 }
  );

  // Optimized service queries
  const serviceQuery = useOptimizedQueries(
    async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      
      return data?.map(item => ({
        id: item.id,
        name: item.nome,
        price: item.preco,
        durationMinutes: item.duracao_minutos,
        description: item.descricao
      })) as Service[] || [];
    },
    'services',
    { cacheTime: 15 * 60 * 1000, staleTime: 10 * 60 * 1000 }
  );

  // Initialize queries
  const initializeData = useCallback(async () => {
    await Promise.all([
      appointmentQuery.executeQuery(),
      clientQuery.executeQuery(),
      serviceQuery.executeQuery()
    ]);
  }, [appointmentQuery, clientQuery, serviceQuery]);

  // Memoized calculations
  const calculations = useMemoizedCalculations({
    appointments: appointmentQuery.data || [],
    services: serviceQuery.data || [],
    clients: clientQuery.data || [],
    expenses: [], // TODO: Add expense query when needed
  });

  // Optimized refetch functions
  const refetchAppointments = useCallback(() => {
    return appointmentQuery.refetch();
  }, [appointmentQuery]);

  const refetchClients = useCallback(() => {
    return clientQuery.refetch();
  }, [clientQuery]);

  const refetchServices = useCallback(() => {
    return serviceQuery.refetch();
  }, [serviceQuery]);

  // Invalidate all caches
  const invalidateAllCaches = useCallback(() => {
    appointmentQuery.invalidateQuery();
    clientQuery.invalidateQuery();
    serviceQuery.invalidateQuery();
  }, [appointmentQuery, clientQuery, serviceQuery]);

  // Loading state
  const loading = useMemo(() => 
    appointmentQuery.loading || clientQuery.loading || serviceQuery.loading,
    [appointmentQuery.loading, clientQuery.loading, serviceQuery.loading]
  );

  // Error state
  const error = useMemo(() => 
    appointmentQuery.error || clientQuery.error || serviceQuery.error,
    [appointmentQuery.error, clientQuery.error, serviceQuery.error]
  );

  return {
    // Data
    appointments: appointmentQuery.data || [],
    clients: clientQuery.data || [],
    services: serviceQuery.data || [],
    
    // Calculations
    ...calculations,
    
    // States
    loading,
    error,
    
    // Actions
    initializeData,
    refetchAppointments,
    refetchClients,
    refetchServices,
    invalidateAllCaches,
  };
};
