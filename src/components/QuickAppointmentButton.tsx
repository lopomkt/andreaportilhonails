
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";

export function QuickAppointmentButton() {
  const { openModal } = useAppointmentsModal();
  
  return (
    <Button 
      onClick={() => openModal()}
      className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90 text-white flex items-center justify-center"
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">Novo Agendamento</span>
    </Button>
  );
}

// Add the global type declaration for TypeScript
declare global {
  interface Window {
    openQuickAppointmentModal?: (defaultDate?: Date) => void;
  }
}
