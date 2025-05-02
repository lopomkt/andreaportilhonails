
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Set up global type definition for the window object
declare global {
  interface Window {
    openQuickAppointmentModal?: () => void;
  }
}

export const QuickAppointmentButton = () => {
  const handleOpenModal = () => {
    if (typeof window.openQuickAppointmentModal === 'function') {
      window.openQuickAppointmentModal();
    }
  };

  return (
    <Button
      onClick={handleOpenModal}
      className="fixed bottom-24 right-6 z-50 rounded-full h-14 w-14 shadow-lg p-0 bg-rose-500 hover:bg-rose-600"
      aria-label="Agendar rápido"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
};
