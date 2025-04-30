
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
import { useAppointments } from "@/hooks/appointments";

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
  const { createAppointment } = useAppointments();
  const { toast } = useToast();

  const { refetchAppointments } = useDataContext();
  
  const { selectedClient: contextSelectedClient, selectedDate, closeModal } = useAppointmentsModal();

  const [clientId, setClientId] = useState(
    contextSelectedClient?.id || initialClientId || appointment?.clientId || ""
  );
  
  const [serviceId, setServiceId] = useState(initialServiceId || appointment?.serviceId || "");
  const isEditing = !!appointment;
  const [status, setStatus] = useState<AppointmentStatus>(
  isEditing ? (appointment?.status || "confirmed") : "confirmed"
);

  
  const [date, setDate] = useState<Date>(
    selectedDate || propDate || initialDate || (appointment ? new Date(appointment.date) : new Date())
  );
  
  const [errors, setErrors] = useState({
    clientId: false,
    serviceId: false,
    date: false,
    time: false
  });

  const getAvailableTimeSlots = () => {
    const timeSlots = [];
    const startTime = 7; // 7:00 AM
    const endTime = 19; // 7:00 PM (19:00)
    
    for (let hour = startTime; hour < endTime; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
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
    
    if (currentHour < 7 || currentHour >= 19) {
      return "07:00";
    }
    
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
    if (clientId) setErrors(prev => ({...prev, clientId: false}));
  }, [clientId]);
  
  useEffect(() => {
    if (serviceId) setErrors(prev => ({...prev, serviceId: false}));
  }, [serviceId]);
  
  useEffect(() => {
    if (date) setErrors(prev => ({...prev, date: false}));
  }, [date]);
  
  useEffect(() => {
    if (time) setErrors(prev => ({...prev, time: false}));
  }, [time]);

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

  const resetForm = () => {
    setClientId("");
    setServiceId("");
    setDate(new Date());
    setTime(defaultTime());
    setNotes("");
    setSelectedClientState(null);
    setErrors({
      clientId: false,
      serviceId: false,
      date: false,
      time: false
    });
  };

  const validateForm = () => {
    const newErrors = {
      clientId: !clientId,
      serviceId: !serviceId,
      date: !date,
      time: !time
    };
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };

  const focusFirstInvalidField = () => {
    if (errors.clientId) {
      document.getElementById('client-autocomplete')?.focus();
    } else if (errors.serviceId) {
      document.getElementById('service')?.focus();
    } else if (errors.date) {
      document.getElementById('date')?.focus();
    } else if (errors.time) {
      document.getElementById('time')?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Chamou handleSubmit");
    
    if (!validateForm()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      
      focusFirstInvalidField();
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
    
    try {
      // Parse date and time into a complete DateTime object
      const appointmentDate = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      const selectedServiceObj = services.find(s => s.id === serviceId);
      const serviceDuration = selectedServiceObj?.durationMinutes || 60;
      
      // Calculate end time by adding service duration to start time
      const endDateTime = addMinutes(appointmentDate, serviceDuration);
      
      // Build appointment object with new table structure in mind
      const result = await createAppointment({
        clienteId: clientId,
        servicoId: serviceId,
        data: appointmentDate,              // This will become data_inicio
        horaFim: endDateTime,               // This will become data_fim
        preco: price,
        status: status || "pendente",       // Using pendente as default status
        observacoes: notes || ""
      });
      
      if (result.success) {
  await refetchAppointments(); // Atualiza dados do dashboard
  closeModal();
}

      
      console.log("Resultado do agendamento:", result);
      console.log("Resultado Final:", result);
      
      if (result.success) {
        toast({
          title: "Agendamento criado com sucesso!",
          description: "O agendamento foi criado com sucesso.",
          variant: "default"
        });
        
        resetForm();
        
        if (onSuccess) onSuccess();
        closeModal();
        await refetchAppointments();
      } else {
        console.error("Error creating appointment:", result.error);
        toast({
          title: "Erro ao agendar",
          description: result.error?.message || "Erro desconhecido ao agendar",
          variant: "destructive",
        });
        
        focusFirstInvalidField();
      }
    } catch (error: any) {
      console.error("Erro inesperado:", error);
      toast({
        title: "Erro ao agendar",
        description: error?.message || "Erro inesperado ao agendar.",
        variant: "destructive",
      });
      
      focusFirstInvalidField();
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
        <Label htmlFor="client" className={errors.clientId ? "text-red-500" : ""}>
          Cliente <span className="text-red-500">*</span>
        </Label>
        <ClientAutocomplete 
          onClientSelect={handleClientSelect} 
          selectedClient={selectedClientState}
          className={errors.clientId ? "border-red-500" : ""}
          autofocus={errors.clientId}
        />
        {errors.clientId && (
          <p className="text-sm text-red-500">Selecione um cliente</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="service" className={errors.serviceId ? "text-red-500" : ""}>
            Serviço <span className="text-red-500">*</span>
          </Label>
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
              <SelectTrigger id="service" className={errors.serviceId ? "border-red-500" : ""}>
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
          {errors.serviceId && (
            <p className="text-sm text-red-500">Selecione um serviço</p>
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
          <Label className={errors.date ? "text-red-500" : ""}>
            Data <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                  errors.date && "border-red-500"
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
          {errors.date && (
            <p className="text-sm text-red-500">Selecione uma data</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time" className={errors.time ? "text-red-500" : ""}>
            Horário <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={time}
            onValueChange={setTime}
          >
            <SelectTrigger id="time" className={cn("w-full", errors.time && "border-red-500")}>
              <SelectValue placeholder="Selecione um horário" />
            </SelectTrigger>
            <SelectContent>
              {availableTimeSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.time && (
            <p className="text-sm text-red-500">Selecione um horário</p>
          )}
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
{isEditing && <SelectItem value="canceled">Cancelado</SelectItem>}

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
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => closeModal()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Agendando...
            </>
          ) : appointment ? (
            "Atualizar Agendamento"
          ) : (
            "Criar Agendamento"
          )}
        </Button>
      </div>
    </form>
  );
}
