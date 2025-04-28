import { useState, useEffect } from "react";
import { useData } from "@/context/DataProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, addMinutes, isAfter, isBefore, isSameDay, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Client, Service, Appointment, AppointmentStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, formatDuration } from "@/lib/formatters";
import { ClientAutocomplete } from "@/components/ClientAutocomplete";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";
import { useServices } from "@/context/ServiceContext";
import { useAppointmentOperations } from "@/hooks/useAppointmentOperations";

interface AppointmentFormProps {
  onSuccess?: () => void;
  appointment?: Appointment;
  serviceId?: string;
  clientId?: string;
  date?: Date;
  price?: number;
  notes?: string;
  status?: AppointmentStatus;
  initialDate?: Date;
  initialTime?: string; 
}

export function AppointmentForm({ 
  onSuccess, 
  appointment, 
  serviceId: initialServiceId, 
  clientId: initialClientId,
  date: propDate,
  notes: initialNotes,
  price: initialPrice,
  status: initialStatus,
  initialDate,
  initialTime 
}: AppointmentFormProps) {
  const { 
    clients, 
    appointments, 
    blockedDates,
    refetchAppointments
  } = useData();
  
  const { services, loading: servicesLoading } = useServices();
  const { createAppointment } = useAppointmentOperations();
  const { toast } = useToast();
  
  const { selectedClient: contextSelectedClient, selectedDate, closeModal } = useAppointmentsModal();

  const [clientId, setClientId] = useState(
    contextSelectedClient?.id || initialClientId || appointment?.clientId || ""
  );
  
  const [serviceId, setServiceId] = useState(initialServiceId || appointment?.serviceId || "");
  const [status, setStatus] = useState<AppointmentStatus>(initialStatus || appointment?.status || "confirmed");
  
  const [date, setDate] = useState<Date>(
    selectedDate || propDate || initialDate || (appointment ? new Date(appointment.date) : new Date())
  );
  
  const getAvailableTimeSlots = () => {
    const timeSlots = [];
    const startTime = 7; // 7:00 AM
    const endTime = 19; // 7:00 PM (19:00)
    
    for (let hour = startTime; hour < endTime; hour++) {
      // Add full hour
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      // Add half hour
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    // Add the last hour (19:00) without minutes
    timeSlots.push(`${endTime.toString().padStart(2, '0')}:00`);
    
    return timeSlots;
  };

  const availableTimeSlots = getAvailableTimeSlots();

  const defaultTime = () => {
    if (selectedDate) return format(selectedDate, "HH:mm");
    if (initialTime) return initialTime;
    if (appointment) return format(new Date(appointment.date), "HH:mm");
    if (initialDate) return format(initialDate, "HH:mm");
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // If current time is outside working hours (7:00-19:00), default to 7:00
    if (currentHour < 7 || currentHour >= 19) {
      return "07:00";
    }
    
    // Round to nearest 30 minutes
    const roundedMinutes = Math.round(currentMinute / 30) * 30;
    const roundedHour = roundedMinutes === 60 ? currentHour + 1 : currentHour;
    const minutes = roundedMinutes === 60 ? "00" : roundedMinutes.toString().padStart(2, "0");
    
    return `${roundedHour.toString().padStart(2, "0")}:${minutes}`;
  };
  
  const [time, setTime] = useState(defaultTime());
  const [notes, setNotes] = useState(initialNotes || appointment?.notes || "");
  const [price, setPrice] = useState(initialPrice || appointment?.price || 0);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClientState, setSelectedClientState] = useState<Client | null>(
    contextSelectedClient || 
    (clientId && clients.find(c => c.id === clientId)) || 
    null
  );
  
  useEffect(() => {
    console.log("AppointmentForm mounted - services count:", services.length);
  }, [services]);

  useEffect(() => {
    if (contextSelectedClient) {
      setClientId(contextSelectedClient.id);
      setSelectedClientState(contextSelectedClient);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      setTime(format(selectedDate, "HH:mm"));
    }
  }, [contextSelectedClient, selectedDate, clients]);

  const selectedService = services.find(s => s.id === serviceId);

  useEffect(() => {
    if (serviceId) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setPrice(service.price);
      }
    }
  }, [serviceId, services]);

  useEffect(() => {
    if (!date || !time || !serviceId) {
      setHasConflict(false);
      return;
    }

    const startDateTime = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      setHasConflict(false);
      return;
    }
    
    const endDateTime = addMinutes(startDateTime, service.durationMinutes);
    
    const isDateBlocked = blockedDates.some(blockedDate => 
      isSameDay(new Date(blockedDate.date), date) && blockedDate.allDay
    );
    
    if (isDateBlocked) {
      setHasConflict(true);
      setConflictDetails("Esta data está bloqueada para agendamentos.");
      return;
    }
    
    const conflictingAppointments = appointments.filter(a => {
      if (appointment && a.id === appointment.id) return false;
      if (a.status === "canceled") return false;
      
      const appointmentStart = new Date(a.date);
      
      const appointmentService = services.find(s => s.id === a.serviceId);
      const appointmentDuration = appointmentService?.durationMinutes || 60;
      const appointmentEnd = addMinutes(appointmentStart, appointmentDuration);
      
      return (
        (isAfter(startDateTime, appointmentStart) && isBefore(startDateTime, appointmentEnd)) ||
        (isAfter(endDateTime, appointmentStart) && isBefore(endDateTime, appointmentEnd)) ||
        (isBefore(startDateTime, appointmentStart) && isAfter(endDateTime, appointmentEnd)) ||
        (isAfter(startDateTime, appointmentStart) && isBefore(endDateTime, appointmentEnd)) ||
        (startDateTime.getTime() === appointmentStart.getTime())
      );
    });
    
    if (conflictingAppointments.length > 0) {
      setHasConflict(true);
      
      const conflict = conflictingAppointments[0];
      const conflictClient = clients.find(c => c.id === conflict.clientId);
      const conflictService = services.find(s => s.id === conflict.serviceId);
      
      setConflictDetails(
        `Conflito com o agendamento de ${conflictClient?.name || "Cliente"} para ${conflictService?.name || "Serviço"} às ${format(new Date(conflict.date), "HH:mm")}.`
      );
    } else {
      setHasConflict(false);
      setConflictDetails("");
    }
  }, [date, time, serviceId, services, appointments, appointment, blockedDates, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !serviceId || !date || !time) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (hasConflict) {
      toast({
        title: "Conflito de horário",
        description: conflictDetails,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const appointmentDate = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    const selectedServiceObj = services.find(s => s.id === serviceId);
    const endDateTime = addMinutes(appointmentDate, selectedServiceObj?.durationMinutes || 60);
    
    try {
      if (appointment) {
        // Use the updateAppointment from DataProvider for existing appointments
        await updateAppointment(appointment.id, {
          clientId,
          serviceId,
          date: appointmentDate.toISOString(),
          endTime: endDateTime.toISOString(),
          status,
          notes,
          price
        });
        
        // Refresh the appointments list
        await refetchAppointments();
        
        toast({
          title: "Agendamento atualizado",
          description: "O agendamento foi atualizado com sucesso.",
        });
      } else {
        // Save the new appointment to Supabase
        await createAppointment({
          clienteId: clientId,
          servicoId: serviceId,
          data: appointmentDate,
          horaFim: endDateTime,
          preco: price,
          status: "confirmado",
          observacoes: notes || "",
          motivoCancelamento: ""
        });
        
        // Refresh the appointments list to update UI
        await refetchAppointments();
        
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso.",
        });
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setClientId(client.id);
    setSelectedClientState(client);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client">Cliente <span className="text-red-500">*</span></Label>
        <ClientAutocomplete 
          onClientSelect={handleClientSelect} 
          selectedClient={selectedClientState} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="service">Serviço <span className="text-red-500">*</span></Label>
          {servicesLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando serviços...</span>
            </div>
          ) : (
            <Select 
              value={serviceId} 
              onValueChange={setServiceId}
            >
              <SelectTrigger id="service">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services && services.length > 0 ? (
                  services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {formatCurrency(service.price)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Nenhum serviço disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      
      {selectedService && (
        <div className="text-sm mt-1 p-2 bg-primary/10 rounded-md">
          <p className="font-medium">{selectedService.name}</p>
          <div className="flex justify-between mt-1">
            <span>Preço: {formatCurrency(selectedService.price)}</span>
            <span>Duração: {formatDuration(selectedService.durationMinutes)}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data <span className="text-red-500">*</span></Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
                disabled={date => 
                  blockedDates.some(bd => 
                    bd.allDay && isSameDay(new Date(bd.date), date)
                  )
                }
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time">Horário <span className="text-red-500">*</span></Label>
          <Select 
            value={time}
            onValueChange={setTime}
          >
            <SelectTrigger id="time" className="w-full">
              <SelectValue placeholder="Selecione um horário" />
            </SelectTrigger>
            <SelectContent>
              {availableTimeSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select 
          value={status} 
          onValueChange={(value) => setStatus(value as AppointmentStatus)}
        >
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
      
      <div className="space-y-2">
        <Label htmlFor="price">Preço</Label>
        <Input 
          id="price" 
          type="number" 
          min="0" 
          step="0.01"
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea 
          id="notes" 
          placeholder="Observações ou detalhes adicionais..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      
      {hasConflict && (
        <div className="flex items-start gap-2 p-3 text-amber-800 bg-amber-50 rounded-md border border-amber-200">
          <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-500" />
          <div>
            <h4 className="font-medium">Conflito de horário</h4>
            <p className="text-sm">{conflictDetails}</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => closeModal()}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90"
          disabled={!clientId || !serviceId || !date || !time || isSubmitting}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {appointment ? "Atualizar Agendamento" : "Criar Agendamento"}
        </Button>
      </div>
    </form>
  );
}
