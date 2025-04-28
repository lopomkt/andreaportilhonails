
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Appointment } from '@/types';
import { Check, Edit, Trash2, MessageSquare } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { useAppointments } from '@/hooks/useAppointments';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
  compact?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  onClick,
  compact = false
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const { updateAppointment, generateWhatsAppLink } = useAppointments();
  const { openModal } = useAppointmentsModal();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open modal with the current appointment data
    openModal(appointment.client, new Date(appointment.date), appointment);
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      // Update status to canceled instead of actually deleting
      await updateAppointment(appointment.id, { 
        status: 'canceled',
        cancellationReason: 'Excluído pelo usuário'
      });
      
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso",
      });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o agendamento",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await updateAppointment(appointment.id, { status: 'confirmed' });
      
      toast({
        title: "Agendamento confirmado",
        description: "O agendamento foi confirmado com sucesso",
      });
    } catch (error) {
      console.error("Error confirming appointment:", error);
      toast({
        title: "Erro ao confirmar",
        description: "Não foi possível confirmar o agendamento",
        variant: "destructive"
      });
    }
  };

  const handleWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      if (!appointment.client) {
        throw new Error("Cliente não encontrado");
      }
      
      const link = await generateWhatsAppLink({
        phone: appointment.client.phone,
        message: `Olá ${appointment.client.name}, confirmo seu agendamento para ${format(new Date(appointment.date), 'dd/MM/yyyy')} às ${format(new Date(appointment.date), 'HH:mm')}`,
        clientName: appointment.client.name,
        appointmentDate: appointment.date
      });
      
      window.open(link, '_blank');
    } catch (error) {
      console.error("Error generating WhatsApp link:", error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o WhatsApp",
        variant: "destructive"
      });
    }
  };

  if (!appointment.client || !appointment.service) {
    return null;
  }

  const statusColor = appointment.status === 'confirmed'
    ? 'bg-green-100 text-green-800 border-green-300'
    : appointment.status === 'canceled'
      ? 'bg-red-100 text-red-800 border-red-300'
      : 'bg-yellow-100 text-yellow-800 border-yellow-300';

  const statusText = appointment.status === 'confirmed'
    ? 'Confirmado'
    : appointment.status === 'canceled'
      ? 'Cancelado'
      : 'Pendente';

  return (
    <>
      <div
        className={cn(
          "bg-white border rounded-md shadow-sm cursor-pointer",
          statusColor,
          compact ? "p-1" : "p-2"
        )}
        onClick={() => onClick?.(appointment)}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
              {appointment.client.name}
            </div>
            <div className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
              {appointment.service.name}
            </div>
            {!compact && (
              <div className="flex items-center mt-1">
                <Badge variant="outline" className={cn(statusColor)}>
                  {statusText}
                </Badge>
                <span className="ml-2 text-sm font-medium">
                  {appointment.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}
          </div>

          {!compact && (
            <div className="flex space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={handleWhatsApp}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>WhatsApp</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={handleEdit}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 hover:bg-red-100 hover:text-red-700"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Excluir</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {appointment.status !== 'confirmed' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 hover:bg-green-100 hover:text-green-700"
                        onClick={handleConfirm}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Confirmar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
