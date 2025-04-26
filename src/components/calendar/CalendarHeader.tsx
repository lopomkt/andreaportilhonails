
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { ChevronDown, Plus, Settings, CalendarX, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CalendarHeaderProps {
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
  const today = new Date();
  
  return (
    <CardHeader className="pb-3 border-b">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">
            Agenda
          </h3>
          <span className="text-muted-foreground text-sm">
            {format(today, "'Hoje é' EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isMobile ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 sm:flex-none"
                onClick={onOpenBlockedDateDialog}
              >
                <CalendarX className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Bloquear Horário</span>
                <span className="sm:hidden">Bloquear</span>
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={onOpenAppointmentDialog}
              >
                <CalendarPlus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Novo Agendamento</span>
                <span className="sm:hidden">Agendar</span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="icon"
                onClick={onOpenBlockedDateDialog}
              >
                <CalendarX className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={onOpenAppointmentDialog}
              >
                <CalendarPlus className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </CardHeader>
  );
}
