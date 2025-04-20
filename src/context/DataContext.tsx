import { createContext, useState, useEffect, ReactNode, useContext } from "react";
import { Client, Service, Appointment, AppointmentStatus, Expense, DashboardStats, MonthlyRevenueData, BlockedDate, WhatsAppMessageData } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/formatters";

const CLIENTS_STORAGE_KEY = "clients";
const SERVICES_STORAGE_KEY = "services";
const APPOINTMENTS_STORAGE_KEY = "appointments";
const EXPENSES_STORAGE_KEY = "expenses";
const WHATSAPP_TEMPLATE_STORAGE_KEY = "whatsappTemplate";
const BLOCKED_DATES_STORAGE_KEY = "blockedDates";

export interface DataContextType {
  clients: Client[];
  services: Service[];
  appointments: Appointment[];
  expenses: Expense[];
  blockedDates: BlockedDate[];
  dashboardStats: DashboardStats;
  addClient: (client: Omit<Client, "id" | "createdAt" | "totalSpent" | "lastAppointment">) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addService: (service: Omit<Service, "id">) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  changeAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  rescheduleAppointment: (id: string, newDate: Date) => Promise<void>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addBlockedDate: (blockedDate: Omit<BlockedDate, "id">) => Promise<void>;
  updateBlockedDate: (id: string, blockedDate: Partial<BlockedDate>) => Promise<void>;
  deleteBlockedDate: (id: string) => Promise<void>;
  getAppointmentsForDate: (date: Date) => Appointment[];
  getTopClients: (limit: number) => Client[];
  calculateDailyRevenue: (date: Date) => number;
  calculatedMonthlyRevenue: (date: Date) => number;
  calculateNetProfit: () => number;
  getRevenueData: () => MonthlyRevenueData[];
  getWhatsAppTemplate: () => string;
  updateWhatsAppTemplate: (template: string) => Promise<void>;
  generateWhatsAppLink: (data: WhatsAppMessageData) => string;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>(() => {
    const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    return storedClients ? JSON.parse(storedClients) : [];
  });
  const [services, setServices] = useState<Service[]>(() => {
    const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
    return storedServices ? JSON.parse(storedServices) : [];
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const storedAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    return storedAppointments ? JSON.parse(storedAppointments) : [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
    return storedExpenses ? JSON.parse(storedExpenses) : [];
  });
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(() => {
    const storedBlockedDates = localStorage.getItem(BLOCKED_DATES_STORAGE_KEY);
    return storedBlockedDates ? JSON.parse(storedBlockedDates) : [];
  });

  useEffect(() => {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(BLOCKED_DATES_STORAGE_KEY, JSON.stringify(blockedDates));
  }, [blockedDates]);

  const addClient = async (client: Omit<Client, "id" | "createdAt" | "totalSpent" | "lastAppointment">) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      ...client,
      createdAt: new Date().toISOString(),
      totalSpent: 0,
    };
    setClients([...clients, newClient]);
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    setClients(
      clients.map((c) => (c.id === id ? { ...c, ...client } : c))
    );
  };

  const deleteClient = async (id: string) => {
    setClients(clients.filter((c) => c.id !== id));
    setAppointments(appointments.filter((a) => a.clientId !== id));
  };

  const addService = async (service: Omit<Service, "id">) => {
    const newService: Service = {
      id: crypto.randomUUID(),
      ...service,
    };
    setServices([...services, newService]);
  };

  const updateService = async (id: string, service: Partial<Service>) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, ...service } : s))
    );
  };

  const deleteService = async (id: string) => {
    setServices(services.filter((s) => s.id !== id));
    setAppointments(appointments.map(appointment => {
      if (appointment.serviceId === id) {
        return { ...appointment, service: undefined };
      }
      return appointment;
    }));
  };

  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      ...appointment,
    };
    setAppointments([...appointments, newAppointment]);

    // Update client's last appointment and total spent
    const client = clients.find(c => c.id === appointment.clientId);
    if (client) {
      const updatedClient = {
        ...client,
        lastAppointment: appointment.date,
        totalSpent: client.totalSpent + appointment.price,
      };
      updateClient(client.id, updatedClient);
    }
  };

  const updateAppointment = async (id: string, appointment: Partial<Appointment>) => {
    setAppointments(
      appointments.map((a) => (a.id === id ? { ...a, ...appointment } : a))
    );
  };

  const deleteAppointment = async (id: string) => {
    setAppointments(appointments.filter((a) => a.id !== id));
  };

  const changeAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    setAppointments(
      appointments.map((a) =>
        a.id === id ? { ...a, status } : a
      )
    );
  };

  const rescheduleAppointment = async (id: string, newDate: Date) => {
     setAppointments(
      appointments.map((a) =>
        a.id === id ? { ...a, date: newDate.toISOString() } : a
      )
    );
  };

  const addExpense = async (expense: Omit<Expense, "id">) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      ...expense,
    };
    setExpenses([...expenses, newExpense]);
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    setExpenses(
      expenses.map((e) => (e.id === id ? { ...e, ...expense } : e))
    );
  };

  const deleteExpense = async (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  // Add blocked date
  const addBlockedDate = async (blockedDate: Omit<BlockedDate, "id">) => {
    const newBlockedDate: BlockedDate = {
      id: crypto.randomUUID(),
      ...blockedDate
    };
    setBlockedDates([...blockedDates, newBlockedDate]);
  };

  // Update blocked date
  const updateBlockedDate = async (id: string, blockedDate: Partial<BlockedDate>) => {
    setBlockedDates(
      blockedDates.map((bd) => (bd.id === id ? { ...bd, ...blockedDate } : bd))
    );
  };

  // Delete blocked date
  const deleteBlockedDate = async (id: string) => {
    setBlockedDates(blockedDates.filter((bd) => bd.id !== id));
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((appointment) => {
      return format(new Date(appointment.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const getTopClients = (limit: number) => {
    const sortedClients = [...clients].sort((a, b) => b.totalSpent - a.totalSpent);
    return sortedClients.slice(0, limit);
  };

  const calculateDailyRevenue = (date: Date) => {
    return appointments
      .filter((appointment) => {
        const appointmentDate = new Date(appointment.date);
        return (
          appointmentDate.getDate() === date.getDate() &&
          appointmentDate.getMonth() === date.getMonth() &&
          appointmentDate.getFullYear() === date.getFullYear() &&
          appointment.status !== "canceled"
        );
      })
      .reduce((total, appointment) => total + appointment.price, 0);
  };

  // Calculate monthly revenue for a specific month
  const calculatedMonthlyRevenue = (date: Date) => {
    return appointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return (
          appointmentDate.getMonth() === date.getMonth() &&
          appointmentDate.getFullYear() === date.getFullYear() &&
          appointment.status !== "canceled"
        );
      })
      .reduce((total, appointment) => total + appointment.price, 0);
  };

  // Calculate net profit (revenue - expenses)
  const calculateNetProfit = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculate total revenue for current month
    const monthlyRevenue = appointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return (
          appointmentDate.getMonth() === currentMonth &&
          appointmentDate.getFullYear() === currentYear &&
          appointment.status !== "canceled"
        );
      })
      .reduce((total, appointment) => total + appointment.price, 0);
    
    // Calculate total expenses for current month
    const monthlyExpenses = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      })
      .reduce((total, expense) => total + expense.amount, 0);
    
    return monthlyRevenue - monthlyExpenses;
  };

  // Get revenue data for charts
  const getRevenueData = (): MonthlyRevenueData[] => {
    const currentDate = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const monthDate = new Date(currentDate);
      monthDate.setMonth(currentDate.getMonth() - i);
      return monthDate;
    }).reverse();

    return months.map(date => {
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthName = format(date, 'MMM');
      
      // Calculate revenue
      const revenue = appointments
        .filter(appointment => {
          const appointmentDate = new Date(appointment.date);
          return (
            appointmentDate.getMonth() === month &&
            appointmentDate.getFullYear() === year &&
            appointment.status !== "canceled"
          );
        })
        .reduce((total, appointment) => total + appointment.price, 0);
      
      // Calculate expenses
      const monthlyExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getMonth() === month &&
            expenseDate.getFullYear() === year
          );
        })
        .reduce((total, expense) => total + expense.amount, 0);
      
      return {
        name: monthName,
        month: month,
        revenue: revenue,
        expenses: monthlyExpenses,
        profit: revenue - monthlyExpenses
      };
    });
  };

  const dashboardStats: DashboardStats = {
    todayAppointments: getAppointmentsForDate(new Date()).length,
    weekAppointments: appointments.filter(appointment => {
      const today = new Date();
      const appointmentDate = new Date(appointment.date);
      const diffTime = Math.abs(appointmentDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length,
    monthRevenue: calculatedMonthlyRevenue(new Date()),
    inactiveClients: clients.filter(client => {
      if (!client.lastAppointment) return true;
      const lastAppointmentDate = new Date(client.lastAppointment);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastAppointmentDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 40;
    }).length,
  };

  // Get WhatsApp template
  const getWhatsAppTemplate = () => {
    return localStorage.getItem(WHATSAPP_TEMPLATE_STORAGE_KEY) || 
      'Olá {{nome}}, confirmando seu agendamento para {{data}} às {{hora}} para o serviço {{servico}} no valor de {{preco}}.';
  };

  // Update WhatsApp template
  const updateWhatsAppTemplate = async (template: string) => {
    localStorage.setItem(WHATSAPP_TEMPLATE_STORAGE_KEY, template);
    return Promise.resolve();
  };

  // Generate WhatsApp link for a specific appointment or custom message
  const generateWhatsAppLink = (data: WhatsAppMessageData): string => {
    if (!data.client?.phone) return '';
    
    let message = '';
    
    if (data.message) {
      // If a custom message is provided, use it directly
      message = data.message;
    } else if (data.appointment) {
      // If an appointment is provided, use the template
      const template = getWhatsAppTemplate();
      const appointment = data.appointment;
      const date = new Date(appointment.date);
      const formattedDate = format(date, 'dd/MM/yyyy');
      const formattedTime = format(date, 'HH:mm');
      
      message = template
        .replace('{{nome}}', data.client.name)
        .replace('{{data}}', formattedDate)
        .replace('{{hora}}', formattedTime)
        .replace('{{servico}}', appointment.service?.name || '')
        .replace('{{preco}}', formatCurrency(appointment.price));
    }
    
    return `https://wa.me/${data.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const value: DataContextType = {
    clients,
    services,
    appointments,
    expenses,
    blockedDates,
    dashboardStats,
    addClient,
    updateClient,
    deleteClient,
    addService,
    updateService,
    deleteService,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    changeAppointmentStatus,
    rescheduleAppointment,
    addExpense,
    updateExpense,
    deleteExpense,
    addBlockedDate,
    updateBlockedDate,
    deleteBlockedDate,
    getAppointmentsForDate,
    getTopClients,
    calculateDailyRevenue,
    calculatedMonthlyRevenue,
    calculateNetProfit,
    getRevenueData,
    getWhatsAppTemplate,
    updateWhatsAppTemplate,
    generateWhatsAppLink,
  };

  return (
    <DataContext.Provider
      value={value}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
