
import React, { useEffect } from 'react';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';

export function AppointmentModalOpener() {
  const { openModal } = useAppointmentsModal();

  useEffect(() => {
    // Global function to open modal from outside React context
    window.openQuickAppointmentModal = (defaultDate?: Date) => {
      openModal(undefined, defaultDate);
    };
  }, [openModal]);

  return null; // This component doesn't render anything
}
