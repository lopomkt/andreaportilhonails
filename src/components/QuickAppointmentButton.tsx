
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
      className="fixed bottom-20 right-4 h-12 w-12 rounded-full p-0 shadow-lg md:bottom-8 md:right-8"
      onClick={() => openModal()}
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
}

// Add the global type declaration for TypeScript
declare global {
  interface Window {
    openQuickAppointmentModal?: (defaultDate?: Date) => void;
  }
}
