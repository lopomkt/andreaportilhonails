
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlockedDate } from "@/types";
import { useData } from "@/context/DataProvider";
import { useToast } from "@/hooks/use-toast";

interface BlockedDateFormProps {
  initialDate?: Date;
  blockedDate?: BlockedDate;
  onSuccess?: () => void;
}

export function BlockedDateForm({
  initialDate,
  blockedDate,
  onSuccess,
}: BlockedDateFormProps) {
  const [date, setDate] = useState<Date>(
    initialDate || (blockedDate ? new Date(blockedDate.date) : new Date())
  );
  
  const [allDay, setAllDay] = useState<boolean>(
    blockedDate?.allDay !== undefined ? blockedDate.allDay : true
  );
  
  const [time, setTime] = useState<string>(
    blockedDate ? format(new Date(blockedDate.date), "HH:mm") : "09:00"
  );
  
  const [reason, setReason] = useState<string>(blockedDate?.reason || "");
  const [description, setDescription] = useState<string>(blockedDate?.description || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { addBlockedDate, fetchBlockedDates } = useData();
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!date) {
        throw new Error("Por favor, selecione uma data.");
      }
      
      const blockedDateTime = new Date(date);
      
      if (!allDay) {
        const [hours, minutes] = time.split(':').map(Number);
        blockedDateTime.setHours(hours, minutes, 0, 0);
      } else {
        blockedDateTime.setHours(0, 0, 0, 0);
      }
      
      const newBlockedDate = {
        // Convert the Date object to string as required by the BlockedDate type
        date: blockedDateTime.toISOString(),
        reason,
        description,
        allDay,
        dia_todo: allDay // Duplicate field for compatibility
      };
      
      await addBlockedDate(newBlockedDate);
      
      // Refresh blocked dates
      await fetchBlockedDates();
      
      toast({
        title: "Horário bloqueado",
        description: "Horário bloqueado com sucesso.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao bloquear horário",
        description: error.message || "Ocorreu um erro ao bloquear o horário.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
              className="p-3"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="allDay" className="flex-1 cursor-pointer">Bloquear dia inteiro</Label>
        <Switch
          id="allDay"
          checked={allDay}
          onCheckedChange={setAllDay}
        />
      </div>
      
      {!allDay && (
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
      )}
      
      <div className="space-y-2">
        <Label htmlFor="reason">Motivo <span className="text-red-500">*</span></Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex: Feriado, Férias, etc."
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes adicionais..."
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || !date || (!allDay && !time) || !reason}
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {blockedDate ? "Atualizar Bloqueio" : "Bloquear Horário"}
        </Button>
      </div>
    </form>
  );
}
