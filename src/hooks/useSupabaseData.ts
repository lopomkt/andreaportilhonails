import { useState, useEffect, useCallback, useMemo } from 'react';
import { Appointment, AppointmentStatus, BlockedDate, Client, DashboardStats, Service, WhatsAppMessageData, Expense, MonthlyRevenueData } from '@/types';
import { appointmentService } from '@/integrations/supabase/appointmentService';
import { supabase } from '@/integrations/supabase/client';
import { addDays, differenceInDays, format, isAfter, isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const isValidResponse = <T>(response: { data: T | null; error: any } | null): response is { data: T; error: null } => {
  return response !== null && response.data !== null && !response.error;
};

export const useSupabaseData = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weekAppointments: 0,
    monthRevenue: 0,
    inactiveClients: 0,
    newClients: 0,
    totalAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      const appointmentsData = await appointmentService.getAll();
      if (!appointmentsData) {
        console.error('Error: No appointments data returned');
        return [];
      }
      setAppointments(appointmentsData);
      updateDashboardStats(appointmentsData);
      return appointmentsData;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Erro ao carregar agendamentos',
        description: 'Ocorreu um erro ao carregar os agendamentos. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return [];
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      
      if (!isValidResponse(response)) {
        console.error('Error fetching clients:', response?.error);
        toast({
          title: 'Erro ao carregar clientes',
          description: 'Ocorreu um erro ao carregar a lista de clientes.',
          variant: 'destructive',
        });
        return [];
      }
      
      const mappedClients: Client[] = response.data.map(item => ({
        id: item.id,
        name: item.nome || 'Sem nome',
        phone: item.telefone || 'Não informado',
        email: item.email || '',
        notes: item.observacoes || '',
        totalSpent: item.valor_total || 0,
        birthdate: item.data_nascimento || null,
        lastAppointment: item.ultimo_agendamento || null,
        createdAt: item.data_criacao || null
      }));
      
      setClients(mappedClients);
      return mappedClients;
    } catch (error) {
      console.error('Unexpected error fetching clients:', error);
      toast({
        title: 'Erro ao carregar clientes',
        description: 'Ocorreu um erro inesperado ao carregar os clientes.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await supabase
        .from('servicos')
        .select('*')
        .order('nome', { ascending: true });
      
      if (!isValidResponse(response)) {
        console.error('Error fetching services:', response?.error);
        return [];
      }
      
      const mappedServices: Service[] = response.data.map(item => ({
        id: item.id,
        name: item.nome,
        price: item.preco,
        durationMinutes: item.duracao_minutos,
        description: item.descricao
      }));
      
      setServices(mappedServices);
      return mappedServices;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  };

  const refetchAppointments = useCallback(async () => {
    return await fetchAppointments();
  }, []);

  const refetchClients = useCallback(async () => {
    return await fetchClients();
  }, []);

  const refetchServices = useCallback(async () => {
    return await fetchServices();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAppointments(),
          fetchClients(),
          fetchServices(),
          fetchBlockedDates()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Ocorreu um erro ao carregar os dados. Por favor, tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const updateDashboardStats = useCallback((currentAppointments: Appointment[]) => {
    const today = new Date();
    const todayAppts = currentAppointments.filter(appt => 
      isSameDay(new Date(appt.date), today) && 
      appt.status !== "canceled"
    ).length;
    
    const weekAppts = currentAppointments.filter(appt => {
      const apptDate = new Date(appt.date);
      const diff = differenceInDays(apptDate, today);
      return diff >= 0 && diff < 7 && appt.status !== "canceled";
    }).length;
    
    const monthlyRevenue = currentAppointments.filter(appt => {
      const apptDate = new Date(appt.date);
      const month = apptDate.getMonth();
      const year = apptDate.getFullYear();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      return month === currentMonth && year === currentYear && appt.status !== "canceled";
    }).reduce((sum, appt) => sum + appt.price, 0);
    
    const inactiveClientsCount = 0;
    
    setDashboardStats({
      todayAppointments: todayAppts,
      weekAppointments: weekAppts,
      monthRevenue: monthlyRevenue,
      inactiveClients: inactiveClientsCount,
      newClients: 0,
      totalAppointments: currentAppointments.length
    });
  }, []);

  const getAppointmentsForDate = useCallback((date: Date): Appointment[] => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return format(appointmentDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  }, [appointments]);

  const calculateDailyRevenue = useCallback((date: Date): number => {
    return getAppointmentsForDate(date)
      .filter(appt => appt.status !== "canceled")
      .reduce((total, appt) => total + appt.price, 0);
  }, [getAppointmentsForDate]);

  const addAppointment = useCallback(async (appointment: Omit<Appointment, "id">) => {
    try {
      const newAppointment = await appointmentService.create(appointment);
      if (newAppointment) {
        setAppointments(prev => [...prev, newAppointment]);
        updateDashboardStats([...appointments, newAppointment]);
        toast({
          title: 'Agendamento criado',
          description: 'Agendamento criado com sucesso!',
        });
        return newAppointment;
      }
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast({
        title: 'Erro ao criar agendamento',
        description: 'Ocorreu um erro ao criar o agendamento. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
    return null;
  }, [appointments, updateDashboardStats]);

  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>) => {
    try {
      const success = await appointmentService.update(id, data);
      if (success) {
        setAppointments(prev => 
          prev.map(appt => appt.id === id ? { ...appt, ...data } : appt)
        );
        updateDashboardStats(appointments.map(appt => appt.id === id ? { ...appt, ...data } : appt));
        toast({
          title: 'Agendamento atualizado',
          description: 'Agendamento atualizado com sucesso!',
        });
        return true;
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Erro ao atualizar agendamento',
        description: 'Ocorreu um erro ao atualizar o agendamento. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
    return false;
  }, [appointments, updateDashboardStats]);

  const deleteAppointment = useCallback(async (id: string) => {
    try {
      const success = await appointmentService.delete(id);
      if (success) {
        const updatedAppointments = appointments.filter(appt => appt.id !== id);
        setAppointments(updatedAppointments);
        updateDashboardStats(updatedAppointments);
        toast({
          title: 'Agendamento removido',
          description: 'Agendamento removido com sucesso!',
        });
        return true;
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Erro ao remover agendamento',
        description: 'Ocorreu um erro ao remover o agendamento. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
    return false;
  }, [appointments, updateDashboardStats]);

  const rescheduleAppointment = useCallback(async (id: string, newDate: Date) => {
    try {
      const appointment = appointments.find(appt => appt.id === id);
      if (!appointment) return false;
      
      const service = services.find(s => s.id === appointment.serviceId);
      const endTime = new Date(newDate);
      endTime.setMinutes(endTime.getMinutes() + (service?.durationMinutes || 60));
      
      const success = await appointmentService.update(id, { 
        date: newDate.toISOString(),
        endTime: endTime.toISOString()
      });
      
      if (success) {
        setAppointments(prev => 
          prev.map(appt => appt.id === id ? { 
            ...appt, 
            date: newDate.toISOString(),
            endTime: endTime.toISOString() 
          } : appt)
        );
        toast({
          title: 'Agendamento remarcado',
          description: 'Agendamento remarcado com sucesso!',
        });
        return true;
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast({
        title: 'Erro ao remarcar agendamento',
        description: 'Ocorreu um erro ao remarcar o agendamento. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
    return false;
  }, [appointments, services]);

  const changeAppointmentStatus = useCallback(async (id: string, status: AppointmentStatus, cancellationReason?: string) => {
    try {
      const success = await appointmentService.changeStatus(id, status, cancellationReason);
      if (success) {
        setAppointments(prev => 
          prev.map(appt => appt.id === id ? { 
            ...appt, 
            status,
            cancellationReason: status === 'canceled' ? cancellationReason || appt.cancellationReason : appt.cancellationReason 
          } : appt)
        );
        toast({
          title: 'Status atualizado',
          description: `Agendamento ${status === 'confirmed' ? 'confirmado' : status === 'pending' ? 'pendente' : 'cancelado'} com sucesso!`,
        });
        return true;
      }
    } catch (error) {
      console.error('Error changing appointment status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Ocorreu um erro ao atualizar o status do agendamento. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
    return false;
  }, []);

  const generateWhatsAppLink = useCallback(async (data: WhatsAppMessageData) => {
    try {
      if (!data.client?.phone) {
        toast({
          title: 'Erro ao gerar link',
          description: 'O cliente não possui telefone cadastrado.',
          variant: 'destructive',
        });
        return '';
      }
      
      let message = '';
      
      if (data.message) {
        message = data.message;
      } else if (data.appointment) {
        const template = await appointmentService.getWhatsAppTemplate();
        
        const appointmentDate = new Date(data.appointment.date);
        message = template
          .replace('{{nome}}', data.client?.name || '')
          .replace('{{servico}}', data.appointment.service?.name || '')
          .replace('{{data}}', format(appointmentDate, 'dd/MM/yyyy'))
          .replace('{{hora}}', format(appointmentDate, 'HH:mm'))
          .replace('{{preco}}', data.appointment.price.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }));
      }
      
      if (!message) {
        toast({
          title: 'Erro ao gerar mensagem',
          description: 'Não foi possível gerar a mensagem para o WhatsApp.',
          variant: 'destructive',
        });
        return '';
      }
      
      return appointmentService.generateWhatsAppLink(data.client.phone, message);
    } catch (error) {
      console.error('Error generating WhatsApp link:', error);
      toast({
        title: 'Erro ao gerar link',
        description: 'Ocorreu um erro ao gerar o link do WhatsApp. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return '';
    }
  }, []);

  const getWhatsAppTemplate = useCallback(async () => {
    try {
      return await appointmentService.getWhatsAppTemplate();
    } catch (error) {
      console.error('Error getting WhatsApp template:', error);
      return '';
    }
  }, []);

  const updateWhatsAppTemplate = useCallback(async (template: string) => {
    try {
      const success = await appointmentService.updateWhatsAppTemplate(template);
      if (success) {
        toast({
          title: 'Modelo atualizado',
          description: 'Modelo de mensagem atualizado com sucesso!',
        });
        return true;
      }
    } catch (error) {
      console.error('Error updating WhatsApp template:', error);
      toast({
        title: 'Erro ao atualizar modelo',
        description: 'Ocorreu um erro ao atualizar o modelo de mensagem. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
    return false;
  }, []);

  const getTopClients = useCallback((limit: number = 5): Client[] => {
    return [...clients]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }, [clients]);

  const getInactiveClients = useCallback((): Client[] => {
    return [];
  }, [clients]);

  const fetchBlockedDates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('datas_bloqueadas')
        .select('*')
        .order('data', { ascending: true });
      
      if (error) {
        console.error("Error fetching blocked dates:", error);
        return [];
      }
      
      const mappedData = data?.map(item => ({
        id: item.id,
        date: item.data,
        reason: item.motivo || "",
        allDay: item.dia_todo,
        dia_todo: item.dia_todo
      })) || [];
      
      setBlockedDates(mappedData);
      return mappedData;
    } catch (err) {
      console.error("Unexpected error fetching blocked dates:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addBlockedDate = useCallback(async (blockedDate: Omit<BlockedDate, "id">) => {
    try {
      const dateObj = typeof blockedDate.date === 'string' ? new Date(blockedDate.date) : new Date(blockedDate.date);
      
      const newBlockedDate = await appointmentService.createBlockedDate({
        date: dateObj,
        reason: blockedDate.reason,
        allDay: blockedDate.allDay || blockedDate.dia_todo
      });
      
      if (newBlockedDate) {
        await fetchBlockedDates(); // Refresh blocked dates after adding a new one
        toast({
          title: 'Data bloqueada',
          description: 'Data bloqueada com sucesso!',
        });
        return newBlockedDate;
      }
    } catch (error) {
      console.error('Error adding blocked date:', error);
      toast({
        title: 'Erro ao bloquear data',
        description: 'Ocorreu um erro ao bloquear a data. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
    return null;
  }, []);

  const deleteBlockedDate = useCallback(async (id: string) => {
    try {
      const success = await appointmentService.deleteBlockedDate(id);
      if (success) {
        await fetchBlockedDates(); // Refresh blocked dates after deletion
        toast({
          title: 'Data desbloqueada',
          description: 'Data desbloqueada com sucesso!',
        });
        return true;
      }
    } catch (error) {
      console.error('Error deleting blocked date:', error);
      toast({
        title: 'Erro ao desbloquear data',
        description: 'Ocorreu um erro ao desbloquear a data. Por favor, tente novamente.',
        variant: 'destructive',
      });
    }
    return false;
  }, []);

  const getBlockedDates = useCallback(async () => {
    return await fetchBlockedDates();
  }, []);

  const refetchBlockedDates = useCallback(async () => {
    return await fetchBlockedDates();
  }, []);

  useEffect(() => {
    getBlockedDates();
  }, [getBlockedDates]);

  const [expenses, setExpenses] = useState<Expense[]>([]);

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

      if (error) {
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
  }, [services]);
  
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
  }, []);
  
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
  }, []);

  const addExpense = useCallback(async (expense: Omit<Expense, "id">) => {
    return null;
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    return false;
  }, []);

  const calculateNetProfit = useCallback((month?: number, year?: number): number => {
    return 0;
  }, [appointments, expenses]);

  const calculatedMonthlyRevenue = useCallback((month?: number, year?: number): number => {
    return 0;
  }, [appointments]);

  const getRevenueData = useCallback((): MonthlyRevenueData[] => {
    return [];
  }, [appointments, expenses]);

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;
      
      // Refresh clients after deletion
      await fetchClients();
      await fetchAppointments(); // Refresh appointments in case any were tied to this client
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error);
      return { success: false, error };
    }
  };

  const {
    createClient: createSupabaseClient,
    updateClient: updateSupabaseClient,
  } = useMemo(() => {
    return {
      createClient: async (clientData: any) => {
        try {
          const response = await supabase
            .from('clientes')
            .insert([clientData])
            .select()
            .single();
  
          if (!isValidResponse(response)) {
            console.error('Error creating client:', response?.error);
            toast({
              title: 'Erro ao criar cliente',
              description: 'Ocorreu um erro ao criar o cliente. Por favor, tente novamente.',
              variant: 'destructive',
            });
            return null;
          }
  
          const newClient: Client = {
            id: response.data.id,
            name: response.data.nome,
            phone: response.data.telefone,
            email: response.data.email || '',
            notes: response.data.observacoes || '',
            totalSpent: response.data.valor_total || 0,
            birthdate: response.data.data_nascimento || null,
            lastAppointment: response.data.ultimo_agendamento || null,
            createdAt: response.data.data_criacao || null
          };
  
          setClients(prev => [...prev, newClient]);
          return newClient;
        } catch (error) {
          console.error('Error creating client:', error);
          toast({
            title: 'Erro ao criar cliente',
            description: 'Ocorreu um erro ao criar o cliente. Por favor, tente novamente.',
            variant: 'destructive',
          });
          return null;
        }
      },
      updateClient: async (clientId: string, clientData: any) => {
        try {
          const response = await supabase
            .from('clientes')
            .update(clientData)
            .eq('id', clientId)
            .select()
            .single();
  
          if (!isValidResponse(response)) {
            console.error('Error updating client:', response?.error);
            toast({
              title: 'Erro ao atualizar cliente',
              description: 'Ocorreu um erro ao atualizar o cliente. Por favor, tente novamente.',
              variant: 'destructive',
            });
            return false;
          }
  
          setClients(prev =>
            prev.map(client => client.id === clientId ? { ...client, ...response.data } : client)
          );
  
          return true;
        } catch (error) {
          console.error('Error updating client:', error);
          toast({
            title: 'Erro ao atualizar cliente',
            description: 'Ocorreu um erro ao atualizar o cliente. Por favor, tente novamente.',
            variant: 'destructive',
          });
          return false;
        }
      }
    };
  }, [setClients, toast]);

  return {
    appointments,
    clients,
    services,
    dashboardStats,
    loading,
    blockedDates,
    
    addAppointment,
    updateAppointment,
    deleteAppointment,
    rescheduleAppointment,
    changeAppointmentStatus,
    refetchAppointments,
    
    addBlockedDate,
    deleteBlockedDate,
    getBlockedDates,
    refetchBlockedDates,
    
    getAppointmentsForDate,
    getInactiveClients,
    getTopClients,
    calculateDailyRevenue,
    generateWhatsAppLink,
    getWhatsAppTemplate,
    updateWhatsAppTemplate,
    expenses,
    addService,
    updateService,
    deleteService,
    addExpense,
    deleteExpense,
    calculateNetProfit,
    calculatedMonthlyRevenue,
    getRevenueData,
    fetchAppointments,
    fetchClients,
    fetchServices,
    createClient: createSupabaseClient,
    updateClient: updateSupabaseClient,
    deleteClient,
  };
};
