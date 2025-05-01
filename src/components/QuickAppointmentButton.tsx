import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";
export function QuickAppointmentButton() {
  const {
    openModal
  } = useAppointmentsModal();
  React.useEffect(() => {
    // Expose the function globally for convenience
    window.openQuickAppointmentModal = (defaultDate?: Date) => {
      openModal(undefined, defaultDate);
    };

    // Cleanup on unmount
    return () => {
      delete window.openQuickAppointmentModal;
    };
  }, [openModal]);
  return;
}

// Add the global type declaration for TypeScript
declare global {
  interface Window {
    openQuickAppointmentModal?: (defaultDate?: Date) => void;
  }
}