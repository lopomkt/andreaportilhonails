import { createContext, useContext } from 'react';
import { Appointment, Client, Service } from '@/types';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface DataContextType {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<Appointment | null>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  refetchAppointments: () => Promise<Appointment[]>;
  refetchClients: () => Promise<Client[]>;
  generateWhatsAppLink: (data: { client: Client; appointment?: Appointment; message?: string }) => Promise<string>;
}

export const DataContext = createContext<DataContextType>({
  appointments: [],
  clients: [],
  services: [],
  addAppointment: async () => null,
  updateAppointment: async () => false,
  deleteAppointment: async () => false,
  refetchAppointments: async () => [],
  refetchClients: async () => [],
  generateWhatsAppLink: async () => ""
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const supabaseData = useSupabaseData();

  const value = {
    appointments: supabaseData.appointments,
    clients: supabaseData.clients,
    services: supabaseData.services,
    addAppointment: supabaseData.addAppointment,
    updateAppointment: supabaseData.updateAppointment,
    deleteAppointment: supabaseData.deleteAppointment,
    refetchAppointments: supabaseData.refetchAppointments,
    refetchClients: async () => {
      const clients = await supabaseData.fetchClients?.() || [];
      return clients;
    },
    generateWhatsAppLink: supabaseData.generateWhatsAppLink
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
