
import React, { createContext, useContext, useState } from 'react';
import { Client } from '@/types';

interface AppointmentsModalContextType {
  isOpen: boolean;
  selectedClient: Client | null;
  selectedDate: Date | null;
  openModal: (client?: Client | null, date?: Date | null) => void;
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

  const openModal = (client: Client | null = null, date: Date | null = null) => {
    console.log("Opening appointment modal with:", { client: client?.name, date: date?.toISOString() });
    
    // Set data first before opening modal to avoid rendering issues
    setSelectedClient(client);
    setSelectedDate(date);
    
    // Open modal in next tick to ensure data is set first
    setTimeout(() => {
      setIsOpen(true);
    }, 0);
  };

  const closeModal = () => {
    setIsOpen(false);
    
    // Clear data after modal is closed to avoid stale data
    setTimeout(() => {
      setSelectedClient(null);
      setSelectedDate(null);
    }, 300); // Small delay to allow animation to complete
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
