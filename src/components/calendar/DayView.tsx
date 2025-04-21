import React, { useState } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CalendarX, Scissors, Star, FileSpreadsheet, Filter, MessageSquare, Bell, Loader2, Lock, Clock, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/AppointmentForm";
import { AppointmentFormWrapper } from "@/components/AppointmentFormWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Appointment, AppointmentStatus, BlockedDate, Client, Service } from '@/types';
import { BlockedDateForm } from '@/components/BlockedDateForm';
import { cn } from "@/lib/utils";
import { appointmentService } from '@/integrations/supabase/appointmentService';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BlockedDateService } from '@/integrations/supabase/blockedDateService';

interface DayViewProps {
  date: Date;
}
export const DayView: React.FC<DayViewProps> = ({
  date
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date());
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [price, setPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("pending");
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [openBlockedDateDialog, setOpenBlockedDateDialog] = useState(false);
  const [selectedBlockedDate, setSelectedBlockedDate] = useState<BlockedDate | null>(null);
  const [deleteBlockedDateId, setDeleteBlockedDateId] = useState<string | null>(null);
  const [confirmDeleteBlockedOpen, setConfirmDeleteBlockedOpen] = useState(false);
  const [isAdjustingSchedule, setIsAdjustingSchedule] = useState(false);
  const [adjustMinutes, setAdjustMinutes] = useState(15);
  const [confirmAdjustScheduleOpen, setConfirmAdjustScheduleOpen] = useState(false);
  
  const {
    toast
  } = useToast();
  const {
    appointments,
    blockedDates,
    clients,
    services,
    refetchAppointments,
    refetchBlockedDates,
    deleteBlockedDate,
    rescheduleAppointment
  } = useSupabaseData();
  
  const dayAppointments = appointments.filter(appt => isSameDay(new Date(appt.date), date));
  const dayBlocks = blockedDates.filter(block => isSameDay(new Date(block.date), date));
  const appointmentsByHour = dayAppointments.reduce((groups, appointment) => {
    const hour = format(new Date(appointment.date), 'HH:00');
    if (!groups[hour]) {
      groups[hour] = [];
    }
    groups[hour].push(appointment);
    return groups;
  }, {} as Record<string, typeof dayAppointments>);
  const hours = Object.keys(appointmentsByHour).sort();
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'canceled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  const getServiceIcon = (serviceName: string) => {
    const name = serviceName?.toLowerCase() || '';
    if (name.includes('manicure') || name.includes('unha')) {
      return <Scissors className="h-4 w-4" />;
    } else if (name.includes('art') || name.includes('decoração')) {
      return <Star className="h-4 w-4" />;
    } else {
      return <FileSpreadsheet className="h-4 w-4" />;
    }
  };
  
  const handleOpenManageModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setClientId(appointment.clientId);
    setServiceId(appointment.serviceId);
    setAppointmentDate(new Date(appointment.date));
    setAppointmentTime(format(new Date(appointment.date), "HH:mm"));
    setPrice(appointment.price);
    setNotes(appointment.notes || "");
    setStatus(appointment.status);
    setManageModalOpen(true);
    setIsFormDirty(false);
  };
  
  const handleFormChange = () => {
    setIsFormDirty(true);
  };
  
  const handleCloseManageModal = () => {
    if (isFormDirty) {
      setConfirmSaveOpen(true);
    } else {
      setManageModalOpen(false);
      setSelectedAppointment(null);
    }
  };
  
  const handleSaveChanges = async () => {
    if (!selectedAppointment) return;
    setIsSaving(true);
    try {
      const dateWithTime = new Date(appointmentDate);
      const [hours, minutes] = appointmentTime.split(":").map(Number);
      dateWithTime.setHours(hours, minutes, 0, 0);
      const success = await appointmentService.update(selectedAppointment.id, {
        clientId,
        serviceId,
        date: dateWithTime.toISOString(),
        price,
        notes,
        status
      });
      if (success) {
        toast({
          title: "Sucesso",
          description: "Agendamento atualizado com sucesso"
        });
        await refetchAppointments();
      } else {
        toast({
          title: "Erro",
          description: "Falha ao atualizar o agendamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as alterações",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setManageModalOpen(false);
      setConfirmSaveOpen(false);
      setSelectedAppointment(null);
    }
  };
  
  const handleSendMessage = async (type: 'confirmation' | 'reminder') => {
    if (!selectedAppointment || !selectedAppointment.client) return;
    setIsSendingMessage(true);
    try {
      const template = await appointmentService.getWhatsAppTemplate();
      const client = clients.find(c => c.id === clientId);
      const service = services.find(s => s.id === serviceId);
      if (!client || !service) {
        toast({
          title: "Erro",
          description: "Cliente ou serviço não encontrado",
          variant: "destructive"
        });
        setIsSendingMessage(false);
        return;
      }
      const appointmentDateTime = new Date(appointmentDate);
      const [hours, minutes] = appointmentTime.split(":").map(Number);
      appointmentDateTime.setHours(hours, minutes, 0, 0);
      const formattedDate = format(appointmentDateTime, "dd/MM/yyyy", {
        locale: ptBR
      });
      const formattedTime = format(appointmentDateTime, "HH:mm", {
        locale: ptBR
      });
      let message = template.replace(/{{nome}}/g, client.name).replace(/{{servico}}/g, service.name).replace(/{{data}}/g, formattedDate).replace(/{{hora}}/g, formattedTime).replace(/{{preço}}/g, price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }));
      if (type === 'confirmation') {
        message = "✅ *CONFIRMAÇÃO DE HORÁRIO* ✅\n\n" + message;
      } else {
        message = "⏰ *LEMBRETE DE AGENDAMENTO* ⏰\n\n" + message;
      }
      const encodedMessage = encodeURIComponent(message);
      const phoneNumber = client.phone?.replace(/\D/g, '') || '';
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
      if (type === 'confirmation' && status !== 'confirmed') {
        setStatus('confirmed');
        setIsFormDirty(true);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao preparar a mensagem",
        variant: "destructive"
      });
    } finally {
      setIsSendingMessage(false);
    }
  };
  
  const handleOpenBlockedDateDialog = () => {
    setOpenBlockedDateDialog(true);
  };
  
  const handleEditBlockedDate = (blockedDate: BlockedDate) => {
    setSelectedBlockedDate(blockedDate);
    setOpenBlockedDateDialog(true);
  };
  
  const handleDeleteBlockedDate = (id: string) => {
    setDeleteBlockedDateId(id);
    setConfirmDeleteBlockedOpen(true);
  };
  
  const confirmDeleteBlockedDate = async () => {
    if (!deleteBlockedDateId) return;
    
    try {
      const success = await deleteBlockedDate(deleteBlockedDateId);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Bloqueio removido com sucesso"
        });
        await refetchBlockedDates();
      } else {
        toast({
          title: "Erro",
          description: "Falha ao remover bloqueio",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting blocked date:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o bloqueio",
        variant: "destructive"
      });
    } finally {
      setConfirmDeleteBlockedOpen(false);
      setDeleteBlockedDateId(null);
    }
  };
  
  const handleAdjustSchedule = () => {
    setIsAdjustingSchedule(true);
  };
  
  const confirmAdjustSchedule = async () => {
    try {
      const dayAppointments = appointments.filter(appt => {
        const apptDate = new Date(appt.date);
        return isSameDay(apptDate, date) && 
               apptDate > new Date() && 
               appt.status !== 'canceled';
      });
      
      dayAppointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const updatePromises = dayAppointments.map(appt => {
        const currentDate = new Date(appt.date);
        const newDate = new Date(currentDate);
        newDate.setMinutes(currentDate.getMinutes() + adjustMinutes);
        return rescheduleAppointment(appt.id, newDate);
      });
      
      const results = await Promise.all(updatePromises);
      
      if (results.every(result => result)) {
        toast({
          title: "Agenda ajustada",
          description: `Todos os agendamentos foram adiados em ${adjustMinutes} minutos`
        });
        await refetchAppointments();
      } else {
        toast({
          title: "Aviso",
          description: "Alguns agendamentos não puderam ser atualizados",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error adjusting schedule:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao ajustar a agenda",
        variant: "destructive"
      });
    } finally {
      setConfirmAdjustScheduleOpen(false);
      setIsAdjustingSchedule(false);
    }
  };
  
  return <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center py-0 my-[24px] px-[16px]">
        <h2 className="font-bold text-lg md:text-2xl">
          Agendamentos de {format(date, 'dd/MM/yyyy', {
          locale: ptBR
        })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAdjustSchedule} 
            className="flex items-center gap-1 bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
          >
            <Clock className="h-4 w-4" /> 
            Ajustar Agenda
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setOpenBlockedDateDialog(true)} 
            className="flex items-center gap-1"
          >
            <Lock className="h-4 w-4" /> 
            Bloquear
          </Button>
        </div>
      </div>
      
      {showFilters && <div className="bg-accent/10 p-4 rounded-lg mb-4">
          <h3 className="text-sm font-medium mb-2">Filtros</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs">Todos</Button>
            <Button variant="outline" size="sm" className="text-xs">Confirmados</Button>
            <Button variant="outline" size="sm" className="text-xs">Pendentes</Button>
            <Button variant="outline" size="sm" className="text-xs">Cancelados</Button>
          </div>
        </div>}
      
      {dayBlocks.length > 0 && <div className="mt-4 mb-6">
          <h3 className="text-md font-semibold mb-2 flex items-center">
            <CalendarX className="h-4 w-4 mr-2 text-orange-500" />
            Bloqueios
          </h3>
          <div className="space-y-2">
            {dayBlocks.map(block => <Card key={block.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {block.allDay ? 'Dia inteiro' : format(new Date(block.date), 'HH:mm')}
                      </h4>
                      <p className="text-sm text-muted-foreground">{block.reason || block.motivo || 'Sem motivo especificado'}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditBlockedDate(block)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBlockedDate(block.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>}
      
      {hours.length > 0 ? <div className="space-y-6">
          {hours.map(hour => <div key={hour} className="space-y-2">
              <h3 className="text-md font-semibold sticky top-16 bg-background py-1 z-10">
                {hour}
              </h3>
              <div className="space-y-2">
                {appointmentsByHour[hour].map(appt => <Card key={appt.id} className={`border-l-4 ${appt.status === 'confirmed' ? 'border-l-green-500' : appt.status === 'pending' ? 'border-l-yellow-500' : 'border-l-red-500'}`} onClick={() => handleOpenManageModal(appt)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="font-medium">{appt.client?.name}</h4>
                          </div>
                          <div className="flex items-center mt-1">
                            {getServiceIcon(appt.service?.name)}
                            <p className="text-sm ml-1">{appt.service?.name}</p>
                          </div>
                          <div className="flex items-center mt-1 space-x-2">
                            <Badge variant={getStatusBadgeVariant(appt.status) as any}>
                              {appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'pending' ? 'Pendente' : 'Cancelado'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-medium">
                            {appt.price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>
            </div>)}
        </div> : <div className="text-center py-8 bg-accent/10 rounded-lg">
          <p className="text-muted-foreground">Nenhum agendamento para este dia.</p>
        </div>}
      
      <Dialog open={manageModalOpen} onOpenChange={open => {
      if (!open && isFormDirty) {
        setConfirmSaveOpen(true);
      } else if (!open) {
        setManageModalOpen(false);
        setSelectedAppointment(null);
      }
    }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-700 flex items-center">
              <span className="mr-2">💅</span>
              Gerenciar Agendamento
            </DialogTitle>
            <DialogDescription>
              Edite as informações do agendamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={clientId} onValueChange={value => {
              setClientId(value);
              handleFormChange();
            }}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !appointmentDate && "text-muted-foreground")}>
                    {appointmentDate ? format(appointmentDate, "PPP", {
                    locale: ptBR
                  }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={appointmentDate} onSelect={date => {
                  if (date) {
                    setAppointmentDate(date);
                    handleFormChange();
                  }
                }} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input id="time" type="time" value={appointmentTime} onChange={e => {
              setAppointmentTime(e.target.value);
              handleFormChange();
            }} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select value={serviceId} onValueChange={value => {
              setServiceId(value);
              const service = services.find(s => s.id === value);
              if (service) {
                setPrice(service.price);
              }
              handleFormChange();
            }}>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => <SelectItem key={service.id} value={service.id}>
                      {service.name} - {service.price.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Preço</Label>
              <Input id="price" type="number" min="0" step="0.01" value={price} onChange={e => {
              setPrice(parseFloat(e.target.value) || 0);
              handleFormChange();
            }} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" placeholder="Observações ou detalhes adicionais..." value={notes} onChange={e => {
              setNotes(e.target.value);
              handleFormChange();
            }} rows={3} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: AppointmentStatus) => {
              setStatus(value);
              handleFormChange();
            }}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white py-6" onClick={() => handleSendMessage('confirmation')} disabled={isSendingMessage}>
                {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4" />}
                WhatsApp: Confirmar
              </Button>
              <Button className="flex-1 gap-2 bg-blue-500 hover:bg-blue-600 text-white py-6" onClick={() => handleSendMessage('reminder')} disabled={isSendingMessage}>
                {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4" />}
                WhatsApp: Lembrete
              </Button>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end gap-2 mt-6 sm:mt-0">
            <Button variant="outline" onClick={handleCloseManageModal}>
              Cancelar
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => {
            if (isFormDirty) {
              setConfirmSaveOpen(true);
            } else {
              setManageModalOpen(false);
            }
          }} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={openBlockedDateDialog} onOpenChange={setOpenBlockedDateDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-700 flex items-center">
              <span className="mr-2">🔒</span>
              {selectedBlockedDate ? "Editar Bloqueio" : "Bloquear Horário"}
            </DialogTitle>
            <DialogDescription>
              {selectedBlockedDate 
                ? "Edite as informações do bloqueio" 
                : "Preencha os dados para bloquear um horário"}
            </DialogDescription>
          </DialogHeader>
          <BlockedDateForm 
            blockedDate={selectedBlockedDate}
            onSuccess={() => {
              refetchBlockedDates();
              setOpenBlockedDateDialog(false);
              setSelectedBlockedDate(null);
              toast({
                title: "Sucesso",
                description: selectedBlockedDate 
                  ? "Bloqueio atualizado com sucesso" 
                  : "Horário bloqueado com sucesso"
              });
            }} 
            initialDate={date} 
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Você confirma as alterações deste agendamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
            setConfirmSaveOpen(false);
            setManageModalOpen(false);
            setSelectedAppointment(null);
          }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={confirmDeleteBlockedOpen} onOpenChange={setConfirmDeleteBlockedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este bloqueio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmDeleteBlockedOpen(false);
              setDeleteBlockedDateId(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBlockedDate} className="bg-red-500 text-white hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isAdjustingSchedule} onOpenChange={setIsAdjustingSchedule}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-700 flex items-center">
              <span className="mr-2">⏰</span>
              Ajustar Agenda do Dia
            </DialogTitle>
            <DialogDescription>
              Realoque todos os agendamentos subsequentes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjustMinutes">Empurrar agenda em</Label>
              <Select value={adjustMinutes.toString()} onValueChange={(value) => setAdjustMinutes(parseInt(value))}>
                <SelectTrigger id="adjustMinutes">
                  <SelectValue placeholder="Selecione os minutos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-sm">
              <p className="font-medium text-yellow-800 flex items-center">
                <ArrowDown className="h-4 w-4 mr-2" />
                Esta ação irá:</p>
              <p className="mt-2 text-yellow-700">
                • Adiar todos os agendamentos pendentes de hoje em {adjustMinutes} minutos
                <br />
                • Atualizar automaticamente os horários no calendário
                <br />
                • Manter a sequência e a duração original de cada agendamento
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustingSchedule(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => setConfirmAdjustScheduleOpen(true)} 
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Ajustar Horários
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={confirmAdjustScheduleOpen} onOpenChange={setConfirmAdjustScheduleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ajuste de agenda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja empurrar todos os agendamentos restantes em {adjustMinutes} minutos?
              <br /><br />
              <span className="font-semibold">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAdjustScheduleOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAdjustSchedule} 
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {selectedAppointment && !manageModalOpen && <Dialog open={!!selectedAppointment && !manageModalOpen} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
            <DialogHeader>
              <DialogTitle className="text-xl text-rose-700 flex items-center">
                <span className="mr-2">💅</span>
                Editar Agendamento
              </DialogTitle>
            </DialogHeader>
            <AppointmentFormWrapper>
              <AppointmentForm appointment={selectedAppointment} clientId={selectedAppointment.clientId} serviceId={selectedAppointment.serviceId} date={new Date(selectedAppointment.date)} notes={selectedAppointment.notes} price={selectedAppointment.price} status={selectedAppointment.status} onSuccess={() => setSelectedAppointment(null)} />
            </AppointmentFormWrapper>
          </DialogContent>
        </Dialog>}
    </div>;
};
