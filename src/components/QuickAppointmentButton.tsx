
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";

export function QuickAppointmentButton() {
  const { openModal } = useAppointmentsModal();
  
  const handleClick = () => {
    openModal();
  };
  
  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-24 right-8 rounded-full size-14 shadow-lg bg-nail-500 hover:bg-nail-600 z-50"
      aria-label="Novo agendamento rápido"
    >
      <Plus size={24} />
    </Button>
  );
}
