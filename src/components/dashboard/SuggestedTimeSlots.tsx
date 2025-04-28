
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";
import { TimeSlot } from "@/types";

interface SuggestedTimeSlotsProps {
  slots: TimeSlot[];
}

export function SuggestedTimeSlots({ slots }: SuggestedTimeSlotsProps) {
  const { openModal } = useAppointmentsModal();
  
  // Only show available slots
  const availableSlots = slots.filter(slot => slot.available);
  
  // If no available slots, don't render anything
  if (availableSlots.length === 0) {
    return null;
  }

  // Handle clicking on a suggested time slot
  const handleTimeSlotClick = (date: Date) => {
    // Open appointment modal with this date/time
    openModal(null, date);
  };

  return (
    <Card className="bg-nail-50 border-nail-100 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center text-nail-900">
          <Clock className="h-5 w-5 mr-2" />
          Horários sugeridos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm mb-3 text-nail-700">
          Clique em um dos horários abaixo para agendar rapidamente:
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {availableSlots.slice(0, 6).map((slot, i) => (
            <Button
              key={i}
              variant="outline"
              className="bg-white hover:bg-nail-100 border-nail-200 text-nail-800"
              onClick={() => handleTimeSlotClick(slot.date)}
            >
              <div className="flex flex-col items-center w-full">
                <div className="text-xs font-medium">
                  {format(slot.date, "EEEE", { locale: ptBR }).substring(0, 3)}
                </div>
                <div className="font-bold">{format(slot.date, "HH:mm")}</div>
                <div className="text-xs">
                  {format(slot.date, "dd/MM")}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
      {availableSlots.length > 6 && (
        <CardFooter className="pt-0">
          <Button variant="link" className="text-xs text-nail-600 hover:text-nail-800">
            Ver mais horários
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
