
import React, { createContext, useState, useContext, useCallback } from "react";
import { Appointment, Client } from "@/types";

type AppointmentsModalContextType = {
  isOpen: boolean;
  openModal: (appointment?: Appointment | null, defaultDate?: Date) => void;
  closeModal: () => void;
  currentAppointment: Appointment | null;
  selectedClient: Client | null;
  selectedDate: Date | null;
};

const AppointmentsModalContext = createContext<AppointmentsModalContextType>({
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
  currentAppointment: null,
  selectedClient: null,
  selectedDate: null,
});

export const AppointmentsModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const openModal = useCallback((appointment: Appointment | null = null, defaultDate?: Date) => {
    setCurrentAppointment(appointment);
    setSelectedDate(defaultDate || null);
    setSelectedClient(null); // Reset selected client when opening modal directly
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setCurrentAppointment(null);
    setSelectedClient(null);
    setSelectedDate(null);
  }, []);

  return (
    <AppointmentsModalContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        currentAppointment,
        selectedClient,
        selectedDate,
      }}
    >
      {children}
    </AppointmentsModalContext.Provider>
  );
};

export const useAppointmentsModal = () => useContext(AppointmentsModalContext);
