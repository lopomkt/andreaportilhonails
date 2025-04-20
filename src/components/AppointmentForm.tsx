import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, addMinutes, isAfter, isBefore, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Client, Service, Appointment, AppointmentStatus } from "@/types";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, formatDuration } from "@/lib/formatters";

interface AppointmentFormProps {
  appointment?: Appointment;
  selectedDate?: Date;
  // Add these props to match what we're passing from DayView
  clientId?: string;
  serviceId?: string;
  date?: Date;
  notes?: string;
  price?: number;
  status?: AppointmentStatus;
  onSuccess?: () => void;
}

export function AppointmentForm({ 
  appointment,
  selectedDate = new Date(),
  clientId: initialClientId,
  serviceId: initialServiceId,
  date: initialDate,
  notes: initialNotes,
  price: initialPrice,
  status: initialStatus,
  onSuccess 
}: AppointmentFormProps) {
  const { 
    clients, 
    services, 
    appointments, 
    addAppointment, 
    updateAppointment,
    blockedDates
  } = useData();

  // State for form fields
  const [clientId, setClientId] = useState(initialClientId || appointment?.clientId || "");
  const [serviceId, setServiceId] = useState(initialServiceId || appointment?.serviceId || "");
  const [status, setStatus] = useState<AppointmentStatus>(initialStatus || appointment?.status || "pending");
  const [date, setDate] = useState<Date>(initialDate || (appointment ? new Date(appointment.date) : selectedDate));
  const [time, setTime] = useState(
    appointment ? format(new Date(appointment.date), "HH:mm") : "09:00"
  );
  const [notes, setNotes] = useState(initialNotes || appointment?.notes || "");
  const [price, setPrice] = useState(initialPrice || appointment?.price || 0);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<string>("");
  
  // Selected client and service objects
  const selectedClient = clients.find(c => c.id === clientId);
  const selectedService = services.find(s => s.id === serviceId);
  
  // When service changes, update price
  useEffect(() => {
    if (serviceId) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setPrice(service.price);
      }
    }
  }, [serviceId, services]);
  
  // Check for appointment conflicts
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
    
    // Check for date blocking
    const isDateBlocked = blockedDates.some(blockedDate => 
      isSameDay(new Date(blockedDate.date), date) && blockedDate.allDay
    );
    
    if (isDateBlocked) {
      setHasConflict(true);
      setConflictDetails("Esta data está bloqueada para agendamentos.");
      return;
    }
    
    // Check for appointment conflicts
    const conflictingAppointments = appointments.filter(a => {
      // Skip the current appointment when editing
      if (appointment && a.id === appointment.id) return false;
      
      // Skip canceled appointments
      if (a.status === "canceled") return false;
      
      const appointmentStart = new Date(a.date);
      
      // Calculate appointment end time
      const appointmentService = services.find(s => s.id === a.serviceId);
      const appointmentDuration = appointmentService?.durationMinutes || 60;
      const appointmentEnd = addMinutes(appointmentStart, appointmentDuration);
      
      // Check for overlap
      return (
        // New appointment starts during an existing appointment
        (isAfter(startDateTime, appointmentStart) && isBefore(startDateTime, appointmentEnd)) ||
        // New appointment ends during an existing appointment
        (isAfter(endDateTime, appointmentStart) && isBefore(endDateTime, appointmentEnd)) ||
        // New appointment completely contains an existing appointment
        (isBefore(startDateTime, appointmentStart) && isAfter(endDateTime, appointmentEnd)) ||
        // New appointment is completely contained by an existing appointment
        (isAfter(startDateTime, appointmentStart) && isBefore(endDateTime, appointmentEnd)) ||
        // New appointment starts exactly at the same time as an existing appointment
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
  }, [date, time, serviceId, services, appointments, appointment, blockedDates]);
  
  // Handle form submission
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
    
    // Create appointment date
    const appointmentDate = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    // Calculate end time
    const selectedService = services.find(s => s.id === serviceId);
    const endDateTime = addMinutes(appointmentDate, selectedService?.durationMinutes || 60);
    
    try {
      if (appointment) {
        // Update existing appointment
        await updateAppointment(appointment.id, {
          clientId,
          serviceId,
          date: appointmentDate.toISOString(),
          endTime: endDateTime.toISOString(),
          status,
          notes,
          price
        });
        
        toast({
          title: "Agendamento atualizado",
          description: "O agendamento foi atualizado com sucesso.",
        });
      } else {
        // Create new appointment
        await addAppointment({
          clientId,
          serviceId,
          date: appointmentDate.toISOString(),
          endTime: endDateTime.toISOString(),
          status,
          notes,
          price
        });
        
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso.",
        });
      }
      
      // Call success callback
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client">Cliente <span className="text-red-500">*</span></Label>
          <Select 
            value={clientId} 
            onValueChange={setClientId}
          >
            <SelectTrigger id="client">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="service">Serviço <span className="text-red-500">*</span></Label>
          <Select 
            value={serviceId} 
            onValueChange={setServiceId}
          >
            <SelectTrigger id="service">
              <SelectValue placeholder="Selecione um serviço" />
            </SelectTrigger>
            <SelectContent>
              {services.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} - {formatCurrency(service.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Input 
            id="time" 
            type="time" 
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
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
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90"
          disabled={!clientId || !serviceId || !date || !time}
        >
          {appointment ? "Atualizar Agendamento" : "Criar Agendamento"}
        </Button>
      </div>
    </form>
  );
}
