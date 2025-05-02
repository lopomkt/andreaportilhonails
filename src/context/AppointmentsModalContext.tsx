import React, { createContext, useState, useContext, useCallback } from "react";
import { Appointment } from "@/types";

type AppointmentsModalContextType = {
  isOpen: boolean;
  openModal: (appointment?: Appointment | null, defaultDate?: Date) => void;
  closeModal: () => void;
  currentAppointment: Appointment | null;
};

const AppointmentsModalContext = createContext<AppointmentsModalContextType>({
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
  currentAppointment: null,
});

export const AppointmentsModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);

  const openModal = useCallback((appointment: Appointment | null = null, defaultDate?: Date) => {
    setCurrentAppointment(appointment);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setCurrentAppointment(null);
  }, []);

  return (
    <AppointmentsModalContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        currentAppointment,
      }}
    >
      {children}
    </AppointmentsModalContext.Provider>
  );
};

export const useAppointmentsModal = () => useContext(AppointmentsModalContext);
