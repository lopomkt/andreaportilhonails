
import { Appointment, AppointmentStatus, Client, Expense, Service } from "@/types";
import { addDays, addHours, addMinutes, format, setHours, setMinutes, subDays } from "date-fns";

// Generate a list of mock services
export const services: Service[] = [
  {
    id: "1",
    name: "Manicure Simples",
    price: 40,
    durationMinutes: 45,
    description: "Limpeza, cutilagem e esmaltação básica.",
  },
  {
    id: "2",
    name: "Pedicure Completa",
    price: 60,
    durationMinutes: 60,
    description: "Tratamento completo dos pés com hidratação.",
  },
  {
    id: "3",
    name: "Nail Design Artístico",
    price: 90,
    durationMinutes: 90,
    description: "Aplicação de nail art com desenhos elaborados.",
  },
  {
    id: "4",
    name: "Alongamento em Gel",
    price: 120,
    durationMinutes: 120,
    description: "Alongamento de unhas usando sistema de gel.",
  },
  {
    id: "5",
    name: "Blindagem",
    price: 70,
    durationMinutes: 60,
    description: "Proteção das unhas naturais com gel.",
  },
  {
    id: "6",
    name: "Remoção de Gel",
    price: 40,
    durationMinutes: 30,
    description: "Remoção segura de produtos em gel.",
  },
];

// Generate a list of mock clients
export const clients: Client[] = [
  {
    id: "1",
    name: "Mariana Oliveira",
    phone: "(11) 98765-4321",
    email: "mariana@email.com",
    notes: "Prefere tons neutros. Alérgica a alguns produtos com acetona.",
    lastAppointment: subDays(new Date(), 15).toISOString(),
    totalSpent: 450,
    createdAt: subDays(new Date(), 120).toISOString(),
  },
  {
    id: "2",
    name: "Camila Santos",
    phone: "(11) 91234-5678",
    email: "camila@email.com",
    notes: "Gosta de nail art elaborada. Sempre chega 10min atrasada.",
    lastAppointment: subDays(new Date(), 45).toISOString(),
    totalSpent: 380,
    createdAt: subDays(new Date(), 180).toISOString(),
  },
  {
    id: "3",
    name: "Juliana Mendes",
    phone: "(11) 99876-5432",
    lastAppointment: subDays(new Date(), 5).toISOString(),
    totalSpent: 780,
    createdAt: subDays(new Date(), 90).toISOString(),
  },
  {
    id: "4",
    name: "Fernanda Lima",
    phone: "(11) 95555-4444",
    email: "fernanda@email.com",
    notes: "Sempre pede francesinha. Valoriza pontualidade.",
    lastAppointment: subDays(new Date(), 22).toISOString(),
    totalSpent: 340,
    createdAt: subDays(new Date(), 200).toISOString(),
  },
  {
    id: "5",
    name: "Patricia Rocha",
    phone: "(11) 93333-2222",
    lastAppointment: subDays(new Date(), 52).toISOString(),
    totalSpent: 220,
    createdAt: subDays(new Date(), 150).toISOString(),
  },
];

// Function to generate an appointment at a specific date
const generateAppointment = (
  id: string,
  clientId: string,
  serviceId: string,
  date: Date,
  status: AppointmentStatus
): Appointment => {
  const service = services.find((s) => s.id === serviceId);
  const client = clients.find((c) => c.id === clientId);
  
  // Calculate end time based on service duration
  const endTime = new Date(date);
  endTime.setMinutes(endTime.getMinutes() + (service?.durationMinutes || 60));
  
  return {
    id,
    clientId,
    client,
    serviceId,
    service,
    date: date.toISOString(),
    endTime: endTime.toISOString(),
    status,
    price: service?.price || 0,
    notes: "",
  };
};

// Generate appointments for the current week
const today = new Date();
export const appointments: Appointment[] = [
  // Today
  generateAppointment(
    "1",
    "1",
    "1",
    setMinutes(setHours(today, 9), 0),
    "confirmed"
  ),
  generateAppointment(
    "2",
    "3",
    "4",
    setMinutes(setHours(today, 11), 0),
    "confirmed"
  ),
  generateAppointment(
    "3",
    "4",
    "2",
    setMinutes(setHours(today, 14), 30),
    "pending"
  ),
  
  // Tomorrow
  generateAppointment(
    "4",
    "2",
    "3",
    setMinutes(setHours(addDays(today, 1), 10), 0),
    "confirmed"
  ),
  generateAppointment(
    "5",
    "5",
    "1",
    setMinutes(setHours(addDays(today, 1), 16), 0),
    "canceled"
  ),
  
  // Day after tomorrow
  generateAppointment(
    "6",
    "1",
    "5",
    setMinutes(setHours(addDays(today, 2), 13), 0),
    "confirmed"
  ),
  generateAppointment(
    "7",
    "3",
    "2",
    setMinutes(setHours(addDays(today, 2), 15), 30),
    "confirmed"
  ),
  
  // This week
  generateAppointment(
    "8",
    "4",
    "4",
    setMinutes(setHours(addDays(today, 3), 11), 0),
    "pending"
  ),
  generateAppointment(
    "9",
    "2",
    "6",
    setMinutes(setHours(addDays(today, 4), 9), 30),
    "confirmed"
  ),
  
  // Next week
  generateAppointment(
    "10",
    "5",
    "3",
    setMinutes(setHours(addDays(today, 7), 14), 0),
    "confirmed"
  ),
];

// Generate mock expenses
export const expenses: Expense[] = [
  {
    id: "1",
    name: "Esmaltes",
    amount: 150,
    date: subDays(today, 15).toISOString(),
    isRecurring: false,
    category: "Produtos",
  },
  {
    id: "2",
    name: "Aluguel do espaço",
    amount: 800,
    date: subDays(today, 10).toISOString(),
    isRecurring: true,
    category: "Fixo",
  },
  {
    id: "3",
    name: "Material para nail art",
    amount: 230,
    date: subDays(today, 7).toISOString(),
    isRecurring: false,
    category: "Produtos",
  },
  {
    id: "4",
    name: "Assinatura software",
    amount: 50,
    date: subDays(today, 5).toISOString(),
    isRecurring: true,
    category: "Tecnologia",
  },
  {
    id: "5",
    name: "Produtos de limpeza",
    amount: 80,
    date: subDays(today, 2).toISOString(),
    isRecurring: false,
    category: "Manutenção",
  },
];

// Function to get inactive clients (no appointments for at least 40 days)
export const getInactiveClients = (): Client[] => {
  const cutoffDate = subDays(new Date(), 40);
  return clients.filter((client) => {
    return client.lastAppointment && new Date(client.lastAppointment) < cutoffDate;
  });
};

// Function to get top clients by spending
export const getTopClients = (limit: number = 5): Client[] => {
  return [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);
};

// Function to get appointments for specific date
export const getAppointmentsForDate = (date: Date): Appointment[] => {
  return appointments.filter((appointment) => {
    return format(appointment.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });
};

// Function to get monthly revenue
export const getMonthlyRevenue = (): number => {
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  return appointments
    .filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getMonth() === currentMonth &&
        appointmentDate.getFullYear() === currentYear &&
        appointment.status !== "canceled"
      );
    })
    .reduce((total, appointment) => total + appointment.price, 0);
};
