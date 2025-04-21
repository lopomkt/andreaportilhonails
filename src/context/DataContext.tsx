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
  WhatsAppMessageData
} from "@/types";
import { useSupabaseData } from "@/hooks/useSupabaseData";

interface RevenueData {
  month: string;
  revenue: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  expenses?: number;
  profit?: number;
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
    fetchAppointments,
    fetchClients,
    fetchServices,
    createClient: createSupabaseClient,
    updateClient: updateSupabaseClient,
    deleteClient: deleteSupabaseClient,
    addAppointment,
    updateAppointment,
    blockedDates = [],
    expenses = [],
    addExpense,
    deleteExpense,
    addService,
    updateService,
    deleteService,
    calculatedMonthlyRevenue,
  } = useSupabaseData();

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
  }, [fetchAppointments, fetchClients, fetchServices]);

  useEffect(() => {
    const updateData = async () => {
      setLoading(true);
      try {
        const [appointmentsData, clientsData, servicesData] = await Promise.all([
          fetchAppointments(),
          fetchClients(),
          fetchServices(),
        ]);

        setAppointments(appointmentsData);
        setClients(clientsData);
        setServices(servicesData);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthRevenue = appointmentsData.reduce((sum, appointment) => {
          const appointmentDate = new Date(appointment.date);
          if (
            appointment.status === "confirmed" &&
            appointmentDate >= monthStart &&
            appointmentDate <= now
          ) {
            return sum + appointment.price;
          }
          return sum;
        }, 0);

        const newClients = clientsData.filter((client) => {
          const clientCreatedAt = new Date(client.createdAt);
          return clientCreatedAt >= monthStart && clientCreatedAt <= now;
        }).length;

        const totalAppointments = appointmentsData.filter((appointment) => {
          const appointmentDate = new Date(appointment.date);
          return appointmentDate >= monthStart && appointmentDate <= now;
        }).length;

        setDashboardStats({
          monthRevenue,
          newClients,
          totalAppointments,
          inactiveClients: 0,
          todayAppointments: 0,
          weekAppointments: 0,
        });
      } catch (err: any) {
        setError(err.message || "Erro ao atualizar os dados.");
      } finally {
        setLoading(false);
      }
    };

    updateData();
  }, [fetchAppointments, fetchClients, fetchServices]);

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
        (a, b) => b.totalSpent - a.totalSpent
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
    [appointments]
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
  }: {
    client: Client;
    message: string;
  }): Promise<string> => {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${client.phone}?text=${encodedMessage}`;
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
      const { data, error } = await createSupabaseClient(clientData);
      if (error) throw error;
      await refetchClients();
      return { success: true, data };
    } catch (error) {
      console.error("Error creating client:", error);
      return { success: false, error };
    }
  };

  const updateClient = async (clientId: string, clientData: any) => {
    try {
      const { data, error } = await updateSupabaseClient(clientId, clientData);
      if (error) throw error;
      await refetchClients();
      return { success: true, data };
    } catch (error) {
      console.error("Error updating client:", error);
      return { success: false, error };
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await deleteSupabaseClient(clientId);
      
      if (error) throw error;
      
      await refetchClients();
      await refetchAppointments();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error);
      return { success: false, error };
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    try {
      const { data, error } = await addAppointment(appointment);
      if (error) throw error;
      await refetchAppointments();
      return { success: true, data };
    } catch (error) {
      console.error("Error adding appointment:", error);
      return { success: false, error };
    }
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    try {
      const { data: updatedAppointment, error } = await updateAppointment(id, data);
      if (error) throw error;
      await refetchAppointments();
      return { success: true, data: updatedAppointment };
    } catch (error) {
      console.error("Error updating appointment:", error);
      return { success: false, error };
    }
  };

  const addExpense = async (expense: Omit<Expense, "id">) => {
    try {
      const { data, error } = await addExpense(expense);
      if (error) throw error;
      await refetchAppointments();
      return { success: true, data };
    } catch (error) {
      console.error("Error adding expense:", error);
      return { success: false, error };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await deleteExpense(id);
      if (error) throw error;
      await refetchAppointments();
      return { success: true };
    } catch (error) {
      console.error("Error deleting expense:", error);
      return { success: false, error };
    }
  };

  const addService = async (service: Omit<Service, "id">) => {
    try {
      const { data, error } = await addService(service);
      if (error) throw error;
      await refetchServices();
      return { success: true, data };
    } catch (error) {
      console.error("Error adding service:", error);
      return { success: false, error };
    }
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    try {
      const { data: updatedService, error } = await updateService(id, data);
      if (error) throw error;
      await refetchServices();
      return { success: true, data: updatedService };
    } catch (error) {
      console.error("Error updating service:", error);
      return { success: false, error };
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await deleteService(id);
      if (error) throw error;
      await refetchServices();
      return { success: true };
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
