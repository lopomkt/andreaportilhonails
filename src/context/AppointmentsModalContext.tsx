
import React, { createContext, useContext, useState } from 'react';
import { Client, Appointment } from '@/types';

interface AppointmentsModalContextType {
  isOpen: boolean;
  selectedClient: Client | null;
  selectedDate: Date | null;
  selectedAppointment: Appointment | null;  // Added to handle appointments
  openModal: (clientOrAppointment?: Client | Appointment | null, date?: Date | null) => void;
  closeModal: () => void;
}

const defaultContext: AppointmentsModalContextType = {
  isOpen: false,
  selectedClient: null,
  selectedDate: null,
  selectedAppointment: null,  // Added default value
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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const openModal = (clientOrAppointment: Client | Appointment | null = null, date: Date | null = null) => {
    console.log("Opening appointment modal with:", { 
      clientOrAppointment: clientOrAppointment ? 
        ('client' in clientOrAppointment ? clientOrAppointment.client?.name : 
         'name' in clientOrAppointment ? clientOrAppointment.name : 'none') : 'none',
      date: date?.toISOString() || 'none' 
    });
    
    // Determine if the first parameter is a Client or an Appointment
    if (clientOrAppointment && 'date' in clientOrAppointment) {
      // It's an Appointment
      setSelectedAppointment(clientOrAppointment as Appointment);
      setSelectedClient(null);
      setSelectedDate(date || new Date(clientOrAppointment.date));
    } else {
      // It's a Client or null
      setSelectedClient(clientOrAppointment as Client);
      setSelectedAppointment(null);
      setSelectedDate(date);
    }
    
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
      setSelectedAppointment(null);
    }, 300); // Small delay to allow animation to complete
  };

  return (
    <AppointmentsModalContext.Provider
      value={{
        isOpen,
        selectedClient,
        selectedDate,
        selectedAppointment,
        openModal,
        closeModal
      }}
    >
      {children}
    </AppointmentsModalContext.Provider>
  );
};
