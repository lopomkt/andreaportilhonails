
import React, { createContext, useContext, useState } from "react";
import { Appointment, WhatsAppMessageData } from "@/types";
import { useAppointmentContext as useAppointmentHook } from "@/hooks/useAppointmentContext";

interface AppointmentContextType {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  getAppointmentsForDate: (date: Date) => Appointment[];
  calculateDailyRevenue: (date: Date) => number;
  generateWhatsAppLink: (data: WhatsAppMessageData) => Promise<string>;
  refetchAppointments: () => Promise<Appointment[]>;
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<any>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<any>;
}

const AppointmentContext = createContext<AppointmentContextType>({
  appointments: [],
  loading: false,
  error: null,
  getAppointmentsForDate: () => [],
  calculateDailyRevenue: () => 0,
  generateWhatsAppLink: async () => "",
  refetchAppointments: async () => [],
  addAppointment: async () => ({}),
  updateAppointment: async () => ({}),
});

export const AppointmentProvider = ({ children }: { children: React.ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const appointmentContext = useAppointmentHook(setAppointments, appointments);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        loading: false,
        error: null,
        getAppointmentsForDate: appointmentContext.getAppointmentsForDate,
        calculateDailyRevenue: appointmentContext.calculateDailyRevenue,
        generateWhatsAppLink: appointmentContext.generateWhatsAppLink,
        refetchAppointments: appointmentContext.fetchAppointments,
        addAppointment: appointmentContext.addAppointment,
        updateAppointment: appointmentContext.updateAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error("useAppointments must be used within an AppointmentProvider");
  }
  return context;
};
