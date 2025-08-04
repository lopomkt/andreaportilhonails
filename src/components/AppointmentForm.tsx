import { useState, useEffect } from "react";
import { useData } from "@/context/DataProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, addMinutes, isAfter, isBefore, isSameDay, parse, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Client, Service, Appointment, AppointmentStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, formatDuration } from "@/lib/formatters";
import { ClientAutocomplete } from "@/components/ClientAutocomplete";
import { useAppointmentsModal } from "@/context/AppointmentsModalContext";
// Removed - using services from useData instead

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
  initialTime,
}: AppointmentFormProps) {
  const isEditMode = !!appointment;
  const { toast } = useToast();
  const { 
    clients, 
    services,
    appointments, 
    blockedDates,
    addAppointment,
    updateAppointment,
    loading
  } = useData();
  const { selectedClient: contextSelectedClient, selectedDate, closeModal } = useAppointmentsModal();

  const [clientId, setClientId] = useState(
    contextSelectedClient?.id || initialClientId || appointment?.clientId || ""
  );
  
  const [serviceId, setServiceId] = useState(initialServiceId || appointment?.serviceId || "");
  const [date, setDate] = useState<Date | null>(
    propDate || selectedDate || initialDate || appointment?.date ? new Date(appointment?.date || new Date()) : new Date()
  );
  
  const [status, setStatus] = useState<AppointmentStatus>(
    initialStatus || (appointment?.status as AppointmentStatus) || "confirmed"
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
    if (isEditMode && appointment) {
      setClientId(appointment.clientId);
      setServiceId(appointment.serviceId);
      setDate(new Date(appointment.date));
      setPrice(appointment.price);
      setStatus(appointment.status as AppointmentStatus);
      setNotes(appointment.notes || "");
    }
  }, [appointment, isEditMode]);
 
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
    console.log("AppointmentForm: handleSubmit iniciado");
    
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
      if (!date) {
        throw new Error("Data não selecionada");
      }
      
      const appointmentDate = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time based on service duration
      const service = services.find(s => s.id === serviceId);
      const duration = service?.durationMinutes || 60;
      const endTime = addMinutes(appointmentDate, duration);
      
      const appointmentData = {
        clientId,
        serviceId,
        date: appointmentDate,
        endTime,
        price,
        status,
        notes: notes || null,
      };
      
      console.log("AppointmentForm: Dados do agendamento:", appointmentData);
      
      let result;
      if (isEditMode && appointment) {
        console.log("AppointmentForm: Atualizando agendamento existente");
        result = await updateAppointment(appointment.id, appointmentData);
      } else {
        console.log("AppointmentForm: Criando novo agendamento");
        result = await addAppointment(appointmentData);
      }
      
      console.log("AppointmentForm: Resultado da operação:", result);
      
      if (result.success || !result.error) {
        toast({
          title: isEditMode ? "Agendamento atualizado!" : "Agendamento criado!",
          description: isEditMode ? "Agendamento atualizado com sucesso." : "Agendamento criado com sucesso.",
        });
        
        if (!isEditMode) {
          resetForm();
        }
        
        if (onSuccess) {
          onSuccess();
        }
        
        // Close modal after successful operation
        closeModal();
      } else {
        console.error("AppointmentForm: Erro na operação:", result.error);
        toast({
          title: "Erro",
          description: result.error || `Erro ao ${isEditMode ? 'atualizar' : 'criar'} agendamento`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("AppointmentForm: Erro inesperado:", error);
      toast({
        title: "Erro",
        description: error.message || `Erro inesperado ao ${isEditMode ? 'atualizar' : 'criar'} agendamento`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="client-autocomplete">Cliente *</Label>
          <ClientAutocomplete 
            onClientSelect={(client) => {
              if (client) {
                setClientId(client.id);
                setSelectedClientState(client);
              }
            }}
            selectedClient={selectedClientState}
          />
          {errors.clientId && (
            <p className="text-sm text-destructive mt-1">Cliente é obrigatório</p>
          )}
        </div>

        <div>
          <Label htmlFor="service">Serviço *</Label>
          <Select 
            value={serviceId} 
            onValueChange={setServiceId}
          >
            <SelectTrigger id="service" className={cn(errors.serviceId && "border-destructive")}>
              <SelectValue placeholder="Selecione um serviço" />
            </SelectTrigger>
            <SelectContent>
              {loading ? (
                <SelectItem value="loading" disabled>Carregando serviços...</SelectItem>
              ) : services.length === 0 ? (
                <SelectItem value="no-services" disabled>Nenhum serviço cadastrado</SelectItem>
              ) : (
                services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{service.name}</span>
                      <div className="text-sm text-muted-foreground ml-4">
                        {formatCurrency(service.price)} • {formatDuration(service.durationMinutes)}
                      </div>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.serviceId && (
            <p className="text-sm text-destructive mt-1">Serviço é obrigatório</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    errors.date && "border-destructive"
                  )}
                >
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={ptBR}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-destructive mt-1">Data é obrigatória</p>
            )}
          </div>

          <div>
            <Label htmlFor="time">Horário *</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger id="time" className={cn(errors.time && "border-destructive")}>
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time && (
              <p className="text-sm text-destructive mt-1">Horário é obrigatório</p>
            )}
          </div>
        </div>

        {hasConflict && (
          <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{conflictDetails}</p>
          </div>
        )}

        <div>
          <Label htmlFor="price">Preço</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="0,00"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value: AppointmentStatus) => setStatus(value)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre o agendamento..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting || hasConflict}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? "Atualizando..." : "Criando..."}
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {isEditMode ? "Atualizar Agendamento" : "Criar Agendamento"}
            </>
          )}
        </Button>
        
        {!isEditMode && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={resetForm}
            disabled={isSubmitting}
          >
            Limpar
          </Button>
        )}
      </div>
    </form>
  );
}
