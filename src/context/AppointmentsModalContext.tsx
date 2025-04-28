
import React, { createContext, useContext, useState } from "react";
import { Appointment, Client } from "@/types";

interface AppointmentsModalContextType {
  isOpen: boolean;
  selectedClient: Client | null;
  selectedDate: Date | null;
  selectedAppointment: Appointment | null;
  openModal: (client?: Client | null, date?: Date, appointment?: Appointment | null) => void;
  closeModal: () => void;
}

const AppointmentsModalContext = createContext<AppointmentsModalContextType>({
  isOpen: false,
  selectedClient: null,
  selectedDate: null,
  selectedAppointment: null,
  openModal: () => {},
  closeModal: () => {},
});

export const AppointmentsModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const openModal = (client?: Client | null, date?: Date, appointment?: Appointment | null) => {
    setSelectedClient(client || null);
    setSelectedDate(date || null);
    setSelectedAppointment(appointment || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedClient(null);
    setSelectedDate(null);
    setSelectedAppointment(null);
  };

  return (
    <AppointmentsModalContext.Provider
      value={{
        isOpen,
        selectedClient,
        selectedDate,
        selectedAppointment,
        openModal,
        closeModal,
      }}
    >
      {children}
    </AppointmentsModalContext.Provider>
  );
};

export const useAppointmentsModal = () => useContext(AppointmentsModalContext);
