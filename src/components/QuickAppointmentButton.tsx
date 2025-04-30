
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";

export function QuickAppointmentButton() {
  const { openModal } = useAppointmentsModal();
  
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
  
  return (
    <Button
      onClick={() => openModal()}
      className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 p-0"
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">Novo agendamento</span>
    </Button>
  );
}

// Add the global type declaration for TypeScript
declare global {
  interface Window {
    openQuickAppointmentModal?: (defaultDate?: Date) => void;
  }
}
