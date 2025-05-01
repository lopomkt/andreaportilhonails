
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

  // Return a button component instead of void
  return (
    <Button 
      onClick={() => openModal()} 
      variant="default" 
      size="sm"
      className="gap-1"
    >
      <Plus className="h-4 w-4" /> Novo Agendamento
    </Button>
  );
}

// Add the global type declaration for TypeScript
declare global {
  interface Window {
    openQuickAppointmentModal?: (defaultDate?: Date) => void;
  }
}
