
import React, { createContext, useContext, useState } from "react";
import { Service, Appointment } from "@/types";
import { useServiceContext as useServiceHook } from "@/hooks/useServiceContext";

interface ServiceContextType {
  services: Service[];
  loading: boolean;
  error: string | null;
  calculateServiceRevenue: (appointments: Appointment[], services: Service[]) => { name: string; value: number; count: number }[];
  addService: (service: Omit<Service, "id">) => Promise<any>;
  updateService: (id: string, data: Partial<Service>) => Promise<any>;
  deleteService: (id: string) => Promise<any>;
  fetchServices: () => Promise<Service[]>;
}

const ServiceContext = createContext<ServiceContextType>({
  services: [],
  loading: false,
  error: null,
  calculateServiceRevenue: () => [],
  addService: async () => ({}),
  updateService: async () => ({}),
  deleteService: async () => ({}),
  fetchServices: async () => [],
});

export const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
  const [services, setServices] = useState<Service[]>([]);
  const serviceContext = useServiceHook(setServices, services);

  return (
    <ServiceContext.Provider
      value={{
        services,
        loading: false,
        error: null,
        calculateServiceRevenue: serviceContext.calculateServiceRevenue,
        addService: serviceContext.addService,
        updateService: serviceContext.updateService,
        deleteService: serviceContext.deleteService,
        fetchServices: serviceContext.fetchServices,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
};
