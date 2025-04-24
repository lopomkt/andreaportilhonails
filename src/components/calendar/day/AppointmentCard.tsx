
import React from 'react';
import { format, addMinutes, differenceInMinutes } from 'date-fns';
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Appointment } from '@/types';
import { formatMinutesToHumanTime } from '@/lib/formatters';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick }) => {
  const appointmentDate = new Date(appointment.date);
  const endTime = appointment.endTime 
    ? new Date(appointment.endTime) 
    : addMinutes(appointmentDate, appointment.service?.durationMinutes || 60);
  
  const duration = differenceInMinutes(endTime, appointmentDate);
  
  return (
    <Card 
      className={cn(
        "w-full max-w-sm cursor-pointer hover:shadow-md transition-shadow",
        appointment.status === "confirmed" ? "border-l-4 border-l-green-500" :
        appointment.status === "pending" ? "border-l-4 border-l-amber-500" :
        "border-l-4 border-l-red-500"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-medium">{appointment.client?.name}</h4>
            <p className="text-xs text-muted-foreground">{appointment.service?.name}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>
                {format(appointmentDate, 'HH:mm')} - {format(endTime, 'HH:mm')}
                {' '}({formatMinutesToHumanTime(duration)})
              </span>
            </div>
          </div>
          
          <Badge 
            className={cn(
              "ml-2",
              appointment.status === "confirmed" ? "bg-green-100 text-green-800" :
              appointment.status === "pending" ? "bg-amber-100 text-amber-800" :
              "bg-red-100 text-red-800"
            )}
          >
            {appointment.status === "confirmed" ? "Confirmado" : 
             appointment.status === "pending" ? "Pendente" : "Cancelado"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
