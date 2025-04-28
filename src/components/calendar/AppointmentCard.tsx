
import React from 'react';
import { format, addMinutes, differenceInMinutes } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MessageSquare, Check, X } from "lucide-react";
import { formatMinutesToHumanTime } from '@/lib/formatters';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { useToast } from '@/hooks/use-toast';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
  compact?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick, compact = false }) => {
  const { updateAppointment, generateWhatsAppLink } = useData();
  const { toast } = useToast();
  
  const appointmentDate = new Date(appointment.date);
  const endTime = appointment.endTime 
    ? new Date(appointment.endTime) 
    : addMinutes(appointmentDate, appointment.service?.durationMinutes || 60);
  
  const duration = differenceInMinutes(endTime, appointmentDate);
  
  // Default confirmation status is 'not_confirmed' if not set
  const confirmationStatus = appointment.confirmationStatus || 'not_confirmed';
  
  const handleConfirmationClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      if (confirmationStatus === 'not_confirmed') {
        // Send WhatsApp message
        if (appointment.client?.phone) {
          const whatsappLink = await generateWhatsAppLink({
            phone: appointment.client.phone,
            message: `Olá ${appointment.client.name}! Estamos confirmando seu agendamento de ${appointment.service?.name} para ${format(appointmentDate, 'dd/MM/yyyy')} às ${format(appointmentDate, 'HH:mm')}. Por favor, responda para confirmar. Obrigado!`,
            clientName: appointment.client.name,
            appointmentDate: appointmentDate
          });
          window.open(whatsappLink, '_blank');
        }
        
        // Update status to confirmed
        await updateAppointment(appointment.id, {
          ...appointment,
          confirmationStatus: 'confirmed'
        });
        
        toast({
          title: "Agendamento confirmado",
          description: "Status de confirmação atualizado com sucesso."
        });
      } else if (confirmationStatus === 'confirmed') {
        // Change back to not confirmed
        await updateAppointment(appointment.id, {
          ...appointment,
          confirmationStatus: 'not_confirmed'
        });
        
        toast({
          title: "Status alterado",
          description: "Status de confirmação alterado para não confirmado."
        });
      } else if (confirmationStatus === 'canceled') {
        // Open reschedule dialog (this would need to be implemented)
        toast({
          title: "Reagendar",
          description: "Funcionalidade de reagendamento será implementada em breve."
        });
      }
    } catch (error) {
      console.error("Error updating confirmation status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de confirmação.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card 
      className={cn(
        "w-full max-w-sm cursor-pointer hover:shadow-md transition-shadow",
        appointment.status === "confirmed" ? "border-l-4 border-l-green-500" :
        appointment.status === "pending" ? "border-l-4 border-l-amber-500" :
        "border-l-4 border-l-red-500",
        compact ? "p-2" : ""
      )}
      onClick={onClick}
    >
      <CardContent className={compact ? "p-2" : "p-3"}>
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
          
          <div className="flex flex-col items-end gap-2">
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
            
            {/* Confirmation status button */}
            <Button 
              variant="outline" 
              size="sm"
              className={cn(
                "h-7 text-xs",
                confirmationStatus === 'confirmed' ? "border-green-300 text-green-600 hover:text-green-700 hover:border-green-400" : 
                confirmationStatus === 'canceled' ? "border-red-300 text-red-600 hover:text-red-700 hover:border-red-400" :
                "border-gray-300 text-gray-600 hover:text-gray-700 hover:border-gray-400"
              )}
              onClick={handleConfirmationClick}
            >
              {confirmationStatus === 'confirmed' ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Confirmado
                </>
              ) : confirmationStatus === 'canceled' ? (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Cancelado
                </>
              ) : (
                <>
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
