
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, isToday } from "date-fns";
import { formatAvailableTime } from "@/lib/formatters";

interface TimeSlot {
  time: Date;
  duration: number;
}

interface SuggestedTimeSlotsProps {
  slots: TimeSlot[];
  onSlotClick: () => void;
}

export const SuggestedTimeSlots = ({ slots, onSlotClick }: SuggestedTimeSlotsProps) => {
  if (slots.length === 0) return null;

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
              className="p-2 bg-rose-50 rounded-md border border-rose-100 flex justify-between items-center cursor-pointer hover:bg-rose-100 transition-colors" 
              onClick={onSlotClick}
            >
              <div>
                <p className="font-medium flex items-center">
                  💡 {isToday(slot.time) ? 'Hoje' : 'Amanhã'} às {format(slot.time, 'HH:mm')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Encaixe de {formatAvailableTime(slot.duration)}
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-rose-600">
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

