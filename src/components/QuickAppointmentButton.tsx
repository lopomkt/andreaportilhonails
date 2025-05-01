
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
  
  return (
    <Button
      onClick={() => openModal()}
      className="fixed bottom-24 right-6 rounded-full shadow-lg bg-rose-500 hover:bg-rose-600 h-14 w-14 p-0"
      aria-label="Novo agendamento rápido"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}

// Add the global type declaration for TypeScript
declare global {
  interface Window {
    openQuickAppointmentModal?: (defaultDate?: Date) => void;
  }
}
