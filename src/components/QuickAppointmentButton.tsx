import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";
export function QuickAppointmentButton() {
  const {
    openModal
  } = useAppointmentsModal();
  const handleClick = () => {
    openModal();
  };
  return;
}