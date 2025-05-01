import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types';
import { Loader, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAppointments } from '@/hooks/appointments';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/context/DataProvider';
import { FormControl, FormField, FormItem, FormLabel, Form } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from 'react-hook-form';
import { Textarea } from "@/components/ui/textarea";

interface EditAppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAppointmentModal({ appointment, onClose, onSuccess }: EditAppointmentModalProps) {
  const { updateAppointment, deleteAppointment } = useAppointments();
  const { toast } = useToast();
  const { services } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Check if appointment is valid
  if (!appointment || !appointment.id) {
    toast({
      title: 'Erro',
      description: 'Agendamento inválido',
      variant: 'destructive',
    });
    
    setTimeout(() => {
      onClose();
    }, 100);
    
    return null;
  }

  const form = useForm({
    defaultValues: {
      serviceId: appointment.serviceId,
      date: format(new Date(appointment.date), 'yyyy-MM-dd'),
      time: format(new Date(appointment.date), 'HH:mm'),
      price: appointment.price,
      notes: appointment.notes || '',
    }
  });
  
  // Reset form when appointment changes or editing mode is turned off
  useEffect(() => {
    if (appointment) {
      form.reset({
        serviceId: appointment.serviceId,
        date: format(new Date(appointment.date), 'yyyy-MM-dd'),
        time: format(new Date(appointment.date), 'HH:mm'),
        price: appointment.price,
        notes: appointment.notes || '',
      });
    }
  }, [appointment, form, isEditing]);

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
  
  // When service changes, update price
  const handleServiceChange = (serviceId: string) => {
    console.log("Service changed to:", serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      console.log("Found service, updating price to:", service.price);
      form.setValue('price', service.price);
    }
  };
  
  const handleCancelEdit = () => {
    form.reset({
      serviceId: appointment.serviceId,
      date: format(new Date(appointment.date), 'yyyy-MM-dd'),
      time: format(new Date(appointment.date), 'HH:mm'),
      price: appointment.price,
      notes: appointment.notes || '',
    });
    setIsEditing(false);
  };

  const handleUpdate = async (status: string) => {
    setIsLoading(true);
    try {
      console.log("Updating appointment status to:", status);
      const result = await updateAppointment(appointment.id, { 
        status: status
      });
      
      if (result.success) {
        console.log("Status update successful:", result);
        toast({
          title: 'Agendamento atualizado com sucesso!',
          description: `Status alterado para ${getStatusLabel(status)}`,
        });
        onSuccess();
        onClose();
      } else {
        console.error("Status update failed:", result.error);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar agendamento: ' + (result.error || ''),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar agendamento',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConfirmEdit = async () => {
    // Validate required fields
    const values = form.getValues();
    if (!values.serviceId || !values.date || !values.time) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Serviço, data e horário são campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Combine date and time into a single Date object
      const dateTime = new Date(`${values.date}T${values.time}`);
      console.log("Submitting edit with datetime:", dateTime);
      
      const result = await updateAppointment(appointment.id, {
        serviceId: values.serviceId,
        date: dateTime,
        price: values.price,
        notes: values.notes
      });
      
      if (result.success) {
        console.log("Edit successful:", result);
        toast({
          title: 'Agendamento atualizado com sucesso!',
          description: 'As alterações foram salvas com sucesso',
        });
        setIsEditing(false);
        onSuccess();
        onClose();
      } else {
        console.error("Edit failed:", result.error);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar agendamento: ' + (result.error || ''),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating appointment details:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar agendamento',
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
      console.log("Deleting appointment:", appointment.id);
      const result = await deleteAppointment(appointment.id);
      
      if (result) {
        console.log("Delete successful");
        toast({
          title: 'Agendamento excluído com sucesso!',
          description: 'O agendamento foi excluído com sucesso',
        });
        onSuccess();
        onClose();
      } else {
        console.error("Delete failed");
        toast({
          title: 'Erro',
          description: 'Erro ao excluir agendamento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir agendamento',
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
        
        {!isEditing && (
          <Button 
            onClick={() => setIsEditing(true)}
            className="w-full"
            variant="outline" 
            type="button"
          >
            <Edit className="h-4 w-4 mr-2" /> Editar detalhes
          </Button>
        )}
        
        <Form {...form}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Cliente</h3>
              <p className="text-base">{appointment.client?.name || "Cliente não definido"}</p>
            </div>
            
            {isEditing ? (
              <>
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleServiceChange(value);
                        }}
                        defaultValue={field.value}
                        disabled={!isEditing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={!isEditing} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} disabled={!isEditing} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          disabled={!isEditing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} disabled={!isEditing} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
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
              </>
            )}

            <Separator />
            
            {!isEditing && (
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
            )}
          </div>
        </Form>
        
        <div className="flex justify-between mt-4">
          {isEditing ? (
            <>
              <Button 
                onClick={handleCancelEdit} 
                variant="outline"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              
              <Button 
                onClick={handleConfirmEdit} 
                variant="default"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Confirmar alterações'
                )}
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
