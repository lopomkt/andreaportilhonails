
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAppointments } from '@/hooks/appointments';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface EditAppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAppointmentModal({ appointment, onClose, onSuccess }: EditAppointmentModalProps) {
  const { updateAppointment, deleteAppointment } = useAppointments();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map status to Portuguese labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'canceled': return 'Cancelado';
      default: return status;
    }
  };

  // Map status to badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'canceled': return 'destructive';
      default: return 'default';
    }
  };

  const handleUpdate = async (status: string) => {
    setIsLoading(true);
    try {
      const result = await updateAppointment(appointment.id, { 
        status: status
      });
      
      if (result.success) {
        toast({
          title: 'Agendamento atualizado',
          description: `Status alterado para ${getStatusLabel(status)}`,
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o agendamento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o agendamento',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const result = await deleteAppointment(appointment.id);
      
      if (result) {
        toast({
          title: 'Agendamento excluído',
          description: 'O agendamento foi excluído com sucesso',
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir o agendamento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o agendamento',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Detalhes do Agendamento</span>
            <Badge variant={getStatusVariant(appointment.status) as any}>
              {getStatusLabel(appointment.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Cliente</h3>
            <p className="text-base">{appointment.client?.name || "Cliente não definido"}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Serviço</h3>
            <p className="text-base">{appointment.service?.name || "Serviço não definido"}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Data</h3>
              <p className="text-base">{format(new Date(appointment.date), 'dd/MM/yyyy')}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Horário</h3>
              <p className="text-base">{format(new Date(appointment.date), 'HH:mm')}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Valor</h3>
            <p className="text-base">R$ {appointment.price.toFixed(2).replace('.', ',')}</p>
          </div>
          
          {appointment.notes && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Observações</h3>
              <p className="text-base">{appointment.notes}</p>
            </div>
          )}

          <Separator />
          
          <div className="space-y-4">
            <h3 className="font-medium">Alterar Status</h3>
            
            <div className="flex flex-wrap gap-2">
              {appointment.status !== 'confirmed' && (
                <Button 
                  onClick={() => handleUpdate('confirmed')} 
                  variant="outline" 
                  className="border-green-500 hover:bg-green-50"
                  disabled={isLoading}
                >
                  Confirmar
                </Button>
              )}
              
              {appointment.status !== 'pending' && (
                <Button 
                  onClick={() => handleUpdate('pending')} 
                  variant="outline"
                  className="border-amber-500 hover:bg-amber-50"
                  disabled={isLoading}
                >
                  Marcar como Pendente
                </Button>
              )}
              
              {appointment.status !== 'canceled' && (
                <Button 
                  onClick={() => handleUpdate('canceled')} 
                  variant="outline"
                  className="border-red-500 hover:bg-red-50"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-4">
          <Button 
            onClick={handleDelete} 
            variant="destructive"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir Agendamento'
            )}
          </Button>
          
          <Button onClick={onClose} variant="ghost">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
