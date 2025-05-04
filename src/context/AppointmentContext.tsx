
import React, { createContext, useState, useCallback, useEffect } from "react";
import { Appointment, WhatsAppMessageData } from "@/types";
import { useAppointmentContext } from "@/hooks/useAppointmentContext";

interface AppointmentContextType {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  getAppointmentsForDate: (date: Date) => Appointment[];
  calculateDailyRevenue: (date: Date) => number;
  refetchAppointments: () => Promise<Appointment[]>;
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<any>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<any>;
  generateWhatsAppLink: (data: WhatsAppMessageData) => Promise<string>;
  fetchAppointments: () => Promise<Appointment[]>; // Updated return type
}

export const AppointmentContext = createContext<AppointmentContextType>({
  appointments: [],
  loading: false,
  error: null,
  getAppointmentsForDate: () => [],
  calculateDailyRevenue: () => 0,
  refetchAppointments: async () => [],
  addAppointment: async () => ({}),
  updateAppointment: async () => ({}),
  generateWhatsAppLink: async () => "",
  fetchAppointments: async () => [], // Updated return value
});

export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const {
    fetchAppointments,
    getAppointmentsForDate,
    calculateDailyRevenue,
    addAppointment,
    updateAppointment,
    generateWhatsAppLink
  } = useAppointmentContext(setAppointments, appointments);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        await fetchAppointments();
      } catch (err: any) {
        setError(err.message || "Error loading appointments");
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [fetchAppointments]);

  const refetchAppointments = useCallback(async (): Promise<Appointment[]> => {
    try {
      setLoading(true);
      const data = await fetchAppointments();
      return data;
    } catch (err: any) {
      setError(err.message || "Error refreshing appointments");
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        loading,
        error,
        getAppointmentsForDate,
        calculateDailyRevenue,
        refetchAppointments,
        addAppointment,
        updateAppointment,
        generateWhatsAppLink,
        fetchAppointments,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = React.useContext(AppointmentContext);
  if (!context) {
    throw new Error("useAppointments must be used within an AppointmentProvider");
  }
  return context;
};
