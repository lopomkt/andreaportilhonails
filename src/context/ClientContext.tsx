
import React, { createContext, useContext, useState } from "react";
import { Client } from "@/types";
import { useClientContext as useClientHook } from "@/hooks/useClientContext";
import { useAppointmentContext } from "@/hooks/useAppointmentContext";

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  error: string | null;
  getTopClients: (limit: number) => Client[];
  refetchClients: () => Promise<void>;
  createClient: (clientData: any) => Promise<any>;
  updateClient: (clientId: string, clientData: any) => Promise<any>;
  deleteClient: (clientId: string) => Promise<any>;
}

const ClientContext = createContext<ClientContextType>({
  clients: [],
  loading: false,
  error: null,
  getTopClients: () => [],
  refetchClients: async () => {},
  createClient: async () => ({}),
  updateClient: async () => ({}),
  deleteClient: async () => ({}),
});

export const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const { fetchAppointments } = useAppointmentContext(setClients, clients);
  const clientContext = useClientHook(setClients, fetchAppointments, clients);

  return (
    <ClientContext.Provider
      value={{
        clients,
        loading: false,
        error: null,
        getTopClients: clientContext.getTopClients,
        refetchClients: clientContext.fetchClients,
        createClient: clientContext.createClient,
        updateClient: clientContext.updateClient,
        deleteClient: clientContext.deleteClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClients must be used within a ClientProvider");
  }
  return context;
};
