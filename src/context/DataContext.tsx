
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Appointment,
  Client,
  DashboardStats,
  Service,
  BlockedDate,
  AppointmentStatus,
  Expense,
  WhatsAppMessageData,
  MonthlyRevenueData,
  ServiceResponse
} from "@/types";
import { useSupabaseData } from "@/hooks/useSupabaseData";

interface RevenueData {
  month: string;
  revenue: number;
}

interface DataContextType {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  expenses: Expense[];
  blockedDates: BlockedDate[];
  dashboardStats: DashboardStats;
  revenueData: RevenueData[];
  loading: boolean;
  error: string | null;
  getAppointmentsForDate: (date: Date) => Appointment[];
  getTopClients: (limit: number) => Client[];
  calculateNetProfit: () => number;
  calculateDailyRevenue: (date: Date) => number;
  calculatedMonthlyRevenue: (month?: number, year?: number) => number;
  calculateServiceRevenue: (
    appointments: Appointment[],
    services: Service[]
  ) => { name: string; value: number; count: number }[];
  getRevenueData: () => RevenueData[];
  generateWhatsAppLink: (data: WhatsAppMessageData) => Promise<string>;
  refetchAppointments: () => Promise<void>;
  refetchClients: () => Promise<void>;
  createClient: (clientData: any) => Promise<any>;
  updateClient: (clientId: string, clientData: any) => Promise<any>;
  deleteClient: (clientId: string) => Promise<any>;
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<any>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<any>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<any>;
  deleteExpense: (id: string) => Promise<any>;
  addService: (service: Omit<Service, "id">) => Promise<any>;
  updateService: (id: string, data: Partial<Service>) => Promise<any>;
  deleteService: (id: string) => Promise<any>;
}

export const DataContext = createContext<DataContextType>({
  appointments: [],
  clients: [],
  services: [],
  expenses: [],
  blockedDates: [],
  dashboardStats: {
    monthRevenue: 0,
    newClients: 0,
    totalAppointments: 0,
    inactiveClients: 0,
    todayAppointments: 0,
    weekAppointments: 0,
  },
  revenueData: [],
  loading: false,
  error: null,
  getAppointmentsForDate: () => [],
  getTopClients: () => [],
  calculateNetProfit: () => 0,
  calculateDailyRevenue: () => 0,
  calculatedMonthlyRevenue: () => 0,
  calculateServiceRevenue: () => [],
  getRevenueData: () => [],
  generateWhatsAppLink: async () => "",
  refetchAppointments: async () => {},
  refetchClients: async () => {},
  createClient: async () => ({}),
  updateClient: async () => ({}),
  deleteClient: async () => ({}),
  addAppointment: async () => ({}),
  updateAppointment: async () => ({}),
  addExpense: async () => ({}),
  deleteExpense: async () => ({}),
  addService: async () => ({}),
  updateService: async () => ({}),
  deleteService: async () => ({}),
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    monthRevenue: 0,
    newClients: 0,
    totalAppointments: 0,
    inactiveClients: 0,
    todayAppointments: 0,
    weekAppointments: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  const {
    fetchAppointments: supabaseFetchAppointments,
    fetchClients: supabaseFetchClients,
    fetchServices: supabaseFetchServices,
    createClient: supabaseCreateClient,
    updateClient: supabaseUpdateClient,
    deleteClient: supabaseDeleteClient,
    addAppointment: supabaseAddAppointment,
    updateAppointment: supabaseUpdateAppointment,
    blockedDates = [],
    expenses = [],
    addExpense: supabaseAddExpense,
    deleteExpense: supabaseDeleteExpense,
    addService: supabaseAddService,
    updateService: supabaseUpdateService,
    deleteService: supabaseDeleteService,
    calculatedMonthlyRevenue: supabaseCalculatedMonthlyRevenue,
  } = useSupabaseData();

  const fetchAppointments = async () => {
    return supabaseFetchAppointments ? await supabaseFetchAppointments() : [];
  };
  
  const fetchClients = async () => {
    return supabaseFetchClients ? await supabaseFetchClients() : [];
  };
  
  const fetchServices = async () => {
    return supabaseFetchServices ? await supabaseFetchServices() : [];
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchAppointments(), fetchClients(), fetchServices()]);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getAppointmentsForDate = useCallback(
    (date: Date) => {
      return appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date);
        return (
          appointmentDate.getDate() === date.getDate() &&
          appointmentDate.getMonth() === date.getMonth() &&
          appointmentDate.getFullYear() === date.getFullYear()
        );
      });
    },
    [appointments]
  );

  const getTopClients = useCallback(
    (limit: number) => {
      const sortedClients = [...clients].sort(
        (a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)
      );
      return sortedClients.slice(0, limit);
    },
    [clients]
  );

  const calculateNetProfit = useCallback(() => {
    // Mock expenses calculation
    const expenses = dashboardStats.monthRevenue * 0.3;
    return dashboardStats.monthRevenue - expenses;
  }, [dashboardStats.monthRevenue]);

  const calculateDailyRevenue = useCallback(
    (date: Date) => {
      return getAppointmentsForDate(date).reduce(
        (total, appointment) => total + appointment.price,
        0
      );
    },
    [getAppointmentsForDate]
  );

  const calculatedMonthlyRevenue = useCallback(
    (month?: number, year?: number) => {
      if (supabaseCalculatedMonthlyRevenue) {
        return supabaseCalculatedMonthlyRevenue(month, year);
      }
      
      const now = year ? new Date(year, month || 0, 1) : new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthRevenue = appointments.reduce((sum, appointment) => {
        const appointmentDate = new Date(appointment.date);
        if (
          appointment.status === "confirmed" &&
          appointmentDate >= monthStart &&
          appointmentDate <= monthEnd
        ) {
          return sum + appointment.price;
        }
        return sum;
      }, 0);

      return monthRevenue;
    },
    [appointments, supabaseCalculatedMonthlyRevenue]
  );

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

  const getRevenueData = useCallback(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const data: RevenueData[] = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0);

      const monthRevenue = appointments.reduce((sum, appointment) => {
        const appointmentDate = new Date(appointment.date);
        if (
          appointment.status === "confirmed" &&
          appointmentDate >= monthStart &&
          appointmentDate <= monthEnd
        ) {
          return sum + appointment.price;
        }
        return sum;
      }, 0);

      const monthName = monthStart.toLocaleString("default", { month: "long" });
      data.push({ month: monthName, revenue: monthRevenue });
    }

    return data;
  }, [appointments]);

  const generateWhatsAppLink = async ({
    client,
    message,
  }: WhatsAppMessageData): Promise<string> => {
    const encodedMessage = encodeURIComponent(message || "");
    return `https://wa.me/${client?.phone}?text=${encodedMessage}`;
  };

  const refetchAppointments = async () => {
    setLoading(true);
    try {
      const appointmentsData = await fetchAppointments();
      setAppointments(appointmentsData);
    } catch (err: any) {
      setError(err.message || "Erro ao recarregar os agendamentos.");
    } finally {
      setLoading(false);
    }
  };

  const refetchClients = async () => {
    setLoading(true);
    try {
      const clientsData = await fetchClients();
      setClients(clientsData);
    } catch (err: any) {
      setError(err.message || "Erro ao recarregar os clientes.");
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: any) => {
    try {
      if (supabaseCreateClient) {
        const result = await supabaseCreateClient(clientData);
        if (result && typeof result === 'object' && 'error' in result && result.error) {
          throw result.error;
        }
        await refetchClients();
        return { success: true, data: result ?? null };
      }
      return { success: false, error: "CreateClient function not available" };
    } catch (error) {
      console.error("Error creating client:", error);
      return { success: false, error };
    }
  };

  const updateClient = async (clientId: string, clientData: any) => {
    try {
      if (supabaseUpdateClient) {
        const result = await supabaseUpdateClient(clientId, clientData);
        if (result && typeof result === 'object' && 'error' in result && result.error) {
          throw result.error;
        }
        await refetchClients();
        return { success: true, data: result ?? null };
      }
      return { success: false, error: "UpdateClient function not available" };
    } catch (error) {
      console.error("Error updating client:", error);
      return { success: false, error };
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      if (supabaseDeleteClient) {
        const { error } = await supabaseDeleteClient(clientId);
        
        if (error) throw error;
        
        await refetchClients();
        await refetchAppointments();
        
        return { success: true };
      }
      return { success: false, error: "DeleteClient function not available" };
    } catch (error) {
      console.error('Error deleting client:', error);
      return { success: false, error };
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    try {
      if (supabaseAddAppointment) {
        const response = await supabaseAddAppointment(appointment);
        // Check if response has error property and properly handle it
        if (response && typeof response === 'object' && 'error' in response && response.error) {
          throw response.error;
        }
        await refetchAppointments();
        return { success: true, data: response ?? null };
      }
      return { success: false, error: "AddAppointment function not available" };
    } catch (error) {
      console.error("Error adding appointment:", error);
      return { success: false, error };
    }
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    try {
      if (supabaseUpdateAppointment) {
        const response = await supabaseUpdateAppointment(id, data);
        // Check if response has error property and properly handle it
        if (response && typeof response === 'object' && 'error' in response && response.error) {
          throw response.error;
        }
        await refetchAppointments();
        return { success: true, data: response ?? null };
      }
      return { success: false, error: "UpdateAppointment function not available" };
    } catch (error) {
      console.error("Error updating appointment:", error);
      return { success: false, error };
    }
  };

  const addExpense = async (expense: Omit<Expense, "id">) => {
    try {
      if (supabaseAddExpense) {
        const response = await supabaseAddExpense(expense);
        // Check if response has error property and properly handle it
        if (response && typeof response === 'object' && 'error' in response && response.error) {
          throw response.error;
        }
        await refetchAppointments();
        return { success: true, data: response ?? null };
      }
      return { success: false, error: "AddExpense function not available" };
    } catch (error) {
      console.error("Error adding expense:", error);
      return { success: false, error };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      if (supabaseDeleteExpense) {
        const response = await supabaseDeleteExpense(id);
        // Check if response has error property and properly handle it
        if (response && typeof response === 'object' && 'error' in response && response.error) {
          throw response.error;
        }
        await refetchAppointments();
        return { success: true };
      }
      return { success: false, error: "DeleteExpense function not available" };
    } catch (error) {
      console.error("Error deleting expense:", error);
      return { success: false, error };
    }
  };

  const addService = async (service: Omit<Service, "id">) => {
    try {
      if (supabaseAddService) {
        const response = await supabaseAddService(service);
        // Check if response has error property and properly handle it
        if (response && typeof response === 'object' && 'error' in response && response.error) {
          throw response.error;
        }
        await fetchServices();
        return { success: true, data: response ?? null };
      }
      return { success: false, error: "AddService function not available" };
    } catch (error) {
      console.error("Error adding service:", error);
      return { success: false, error };
    }
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    try {
      if (supabaseUpdateService) {
        const response = await supabaseUpdateService(id, data);
        // Check if response has error property and properly handle it
        if (response && typeof response === 'object' && 'error' in response && response.error) {
          throw response.error;
        }
        await fetchServices();
        return { success: true, data: response ?? null };
      }
      return { success: false, error: "UpdateService function not available" };
    } catch (error) {
      console.error("Error updating service:", error);
      return { success: false, error };
    }
  };

  const deleteService = async (id: string) => {
    try {
      if (supabaseDeleteService) {
        const response = await supabaseDeleteService(id);
        // Check if response has error property and properly handle it
        if (response && typeof response === 'object' && 'error' in response && response.error) {
          throw response.error;
        }
        await fetchServices();
        return { success: true };
      }
      return { success: false, error: "DeleteService function not available" };
    } catch (error) {
      console.error("Error deleting service:", error);
      return { success: false, error };
    }
  };

  return (
    <DataContext.Provider
      value={{
        appointments,
        clients,
        services,
        expenses,
        blockedDates,
        dashboardStats,
        revenueData,
        loading,
        error,
        getAppointmentsForDate,
        getTopClients,
        calculateNetProfit,
        calculateDailyRevenue,
        calculatedMonthlyRevenue,
        calculateServiceRevenue,
        getRevenueData,
        generateWhatsAppLink,
        refetchAppointments,
        refetchClients,
        createClient,
        updateClient,
        deleteClient,
        addAppointment,
        updateAppointment,
        addExpense,
        deleteExpense,
        addService,
        updateService,
        deleteService,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
