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
  RevenueData,
  Service,
} from "@/types";
import { useSupabaseData } from "@/hooks/useSupabaseData";

interface DataContextType {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  dashboardStats: DashboardStats;
  revenueData: RevenueData[];
  loading: boolean;
  error: string | null;
  getAppointmentsForDate: (date: Date) => Appointment[];
  getTopClients: (limit: number) => Client[];
  calculateNetProfit: () => number;
  calculateDailyRevenue: (date: Date) => number;
  calculateServiceRevenue: (
    appointments: Appointment[],
    services: Service[]
  ) => { name: string; value: number; count: number }[];
  getRevenueData: () => RevenueData[];
  generateWhatsAppLink: ({
    client,
    message,
  }: {
    client: Client;
    message: string;
  }) => Promise<string>;
  refetchAppointments: () => Promise<void>;
  refetchClients: () => Promise<void>;
  createClient: (clientData: any) => Promise<any>;
  updateClient: (clientId: string, clientData: any) => Promise<any>;
  deleteClient: (clientId: string) => Promise<any>;
}

export const DataContext = createContext<DataContextType>({
  appointments: [],
  clients: [],
  services: [],
  dashboardStats: {
    totalRevenue: 0,
    monthRevenue: 0,
    newClients: 0,
    totalAppointments: 0,
  },
  revenueData: [],
  loading: false,
  error: null,
  getAppointmentsForDate: () => [],
  getTopClients: () => [],
  calculateNetProfit: () => 0,
  calculateDailyRevenue: () => 0,
  calculateServiceRevenue: () => [],
  getRevenueData: () => [],
  generateWhatsAppLink: async () => "",
  refetchAppointments: async () => {},
  refetchClients: async () => {},
  createClient: async () => ({}),
  updateClient: async () => ({}),
  deleteClient: async () => ({}),
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRevenue: 0,
    monthRevenue: 0,
    newClients: 0,
    totalAppointments: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  const {
    fetchAppointments,
    fetchClients,
    fetchServices,
    createClient: createSupabaseClient,
    updateClient: updateSupabaseClient,
    deleteClient: deleteSupabaseClient,
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

  // Update local state when Supabase data changes
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

        // Calculate dashboard stats here
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
          totalRevenue: appointmentsData.reduce(
            (sum, appointment) => sum + appointment.price,
            0
          ),
          monthRevenue,
          newClients,
          totalAppointments,
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
      
      // Refresh clients after deletion
      await refetchClients();
      await refetchAppointments(); // Refresh appointments in case any were tied to this client
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error);
      return { success: false, error };
    }
  };

  return (
    <DataContext.Provider
      value={{
        appointments,
        clients,
        services,
        dashboardStats,
        revenueData,
        loading,
        error,
        getAppointmentsForDate,
        getTopClients,
        calculateNetProfit,
        calculateDailyRevenue,
        calculateServiceRevenue,
        getRevenueData,
        generateWhatsAppLink,
        refetchAppointments,
        refetchClients,
        createClient,
        updateClient,
        deleteClient,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
