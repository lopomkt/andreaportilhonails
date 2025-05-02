
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// We'll remove the global type declaration since it's already defined in AppointmentModalOpener.tsx
// This will fix the conflicting declaration errors

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
