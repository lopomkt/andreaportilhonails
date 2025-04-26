
import React, { createContext, useContext, useState } from 'react';
import { Client } from '@/types';

interface AppointmentsModalContextType {
  isOpen: boolean;
  selectedClient: Client | null;
  selectedDate: Date | null;
  openModal: (client?: Client, date?: Date) => void;
  closeModal: () => void;
}

const defaultContext: AppointmentsModalContextType = {
  isOpen: false,
  selectedClient: null,
  selectedDate: null,
  openModal: () => {},
  closeModal: () => {},
};

const AppointmentsModalContext = createContext<AppointmentsModalContextType>(defaultContext);

export const useAppointmentsModal = () => {
  const context = useContext(AppointmentsModalContext);
  if (!context) {
    throw new Error('useAppointmentsModal must be used within an AppointmentsModalProvider');
  }
  return context;
};

export const AppointmentsModalProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const openModal = (client?: Client, date?: Date) => {
    setSelectedClient(client || null);
    setSelectedDate(date || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedClient(null);
    setSelectedDate(null);
  };

  return (
    <AppointmentsModalContext.Provider
      value={{
        isOpen,
        selectedClient,
        selectedDate,
        openModal,
        closeModal
      }}
    >
      {children}
    </AppointmentsModalContext.Provider>
  );
};
