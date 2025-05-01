
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, isToday, isTomorrow } from "date-fns";
import { formatAvailableTime } from "@/lib/formatters";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";

interface TimeSlot {
  time: Date;
  duration: number;
}

interface SuggestedTimeSlotsProps {
  slots: TimeSlot[];
}

export const SuggestedTimeSlots = ({ slots }: SuggestedTimeSlotsProps) => {
  const { openModal } = useAppointmentsModal();
  
  if (slots.length === 0) {
    return (
      <Card className="bg-white border-rose-100 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-rose-700 flex items-center text-base font-bold">
            <Clock className="mr-2 h-4 w-4 text-rose-600" />
            Horários Sugeridos para Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-muted-foreground">
            Nenhum horário disponível para agendamento no momento.
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSlotClick = (time: Date) => {
    openModal(undefined, time);
  };

  return (
    <Card className="bg-white border-rose-100 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-rose-700 flex items-center text-base font-bold">
          <Clock className="mr-2 h-4 w-4 text-rose-600" />
          Horários Sugeridos para Agendamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {slots.map((slot, idx) => (
            <div 
              key={idx} 
              className="p-2 bg-rose-50 rounded-md border border-rose-100 flex justify-between items-center hover:bg-rose-100 transition-colors" 
            >
              <div>
                <p className="font-medium flex items-center">
                  💡 {isToday(slot.time) 
                      ? 'Hoje' 
                      : isTomorrow(slot.time) 
                        ? 'Amanhã' 
                        : format(slot.time, 'dd/MM')} às {format(slot.time, 'HH:mm')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Encaixe de {formatAvailableTime(slot.duration)}
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-rose-600"
                      onClick={() => handleSlotClick(slot.time)}
                    >
                      <Clock className="h-4 w-4 mr-1" /> Agendar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clique para agendar neste horário</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
