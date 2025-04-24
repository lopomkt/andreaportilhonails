
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Lock } from "lucide-react";
import { Animation } from "@/components/ui/animation";

interface CalendarHeaderProps {
  isLoading: boolean;
  isMobile: boolean;
  onOpenBlockedDateDialog: () => void;
  onOpenAppointmentDialog: () => void;
}

export function CalendarHeader({
  isLoading,
  isMobile,
  onOpenBlockedDateDialog,
  onOpenAppointmentDialog
}: CalendarHeaderProps) {
  return (
    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-3">
      <div>
        <CardTitle className="font-bold text-rose-700 text-xl">Calendário</CardTitle>
        <CardDescription className="text-sm">Gerencie seus Agendamentos</CardDescription>
      </div>
      
      <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
        <Button 
          className="bg-gray-500 text-white shadow-soft hover:bg-gray-600 w-full sm:w-auto" 
          onClick={onOpenBlockedDateDialog}
          disabled={isLoading}
        >
          {isLoading ? <Animation className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
          {isMobile ? "Bloquear" : "Bloquear Horário"}
        </Button>
        <Button 
          className="bg-rose-500 text-white shadow-soft hover:bg-rose-600 w-full sm:w-auto" 
          onClick={onOpenAppointmentDialog}
          disabled={isLoading}
        >
          {isLoading ? <Animation className="mr-2 h-4 w-4" /> : <CalendarClock className="mr-2 h-4 w-4" />}
          {isMobile ? "Agendar" : "Novo Agendamento"}
        </Button>
      </div>
    </CardHeader>
  );
}
