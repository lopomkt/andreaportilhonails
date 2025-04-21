
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BlockedDate } from "@/types";
import { BlockedDateService } from "@/integrations/supabase/blockedDateService";
import { Loader2 } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";

interface BlockedDateFormProps {
  onSuccess?: () => void;
  initialDate?: Date;
  blockedDate?: BlockedDate | null;
}

export const BlockedDateForm = ({ onSuccess, initialDate, blockedDate }: BlockedDateFormProps) => {
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [time, setTime] = useState("09:00");
  const [allDay, setAllDay] = useState(true);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { refetchBlockedDates } = useSupabaseData();
  
  // If editing an existing blocked date, populate the form
  useEffect(() => {
    if (blockedDate) {
      const blockedDateTime = new Date(blockedDate.date);
      setDate(blockedDateTime);
      setTime(format(blockedDateTime, 'HH:mm'));
      setAllDay(blockedDate.allDay || blockedDate.dia_todo || false);
      setReason(blockedDate.reason || blockedDate.motivo || '');
    }
  }, [blockedDate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create a date object with the selected date and time
      const blockedDateTime = new Date(date);
      if (!allDay) {
        const [hours, minutes] = time.split(':').map(Number);
        blockedDateTime.setHours(hours, minutes, 0, 0);
      } else {
        // Set noon time to avoid timezone issues
        blockedDateTime.setHours(12, 0, 0, 0);
      }
      
      let success = false;
      
      if (blockedDate) {
        // Update existing blocked date
        success = await BlockedDateService.update(blockedDate.id, {
          date: blockedDateTime.toISOString(),
          reason: reason,
          allDay: allDay
        });
      } else {
        // Create new blocked date
        success = await BlockedDateService.create({
          date: blockedDateTime.toISOString(),
          reason: reason,
          allDay: allDay
        });
      }
      
      if (success) {
        toast({
          title: blockedDate ? "Bloqueio atualizado" : "Horário bloqueado",
          description: blockedDate 
            ? "O bloqueio foi atualizado com sucesso." 
            : "O horário foi bloqueado com sucesso."
        });
        
        // Force refresh of blocked dates
        await refetchBlockedDates();
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Erro",
          description: blockedDate 
            ? "Não foi possível atualizar o bloqueio." 
            : "Não foi possível bloquear o horário.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating blocked date:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="items-top flex space-x-2">
        <Checkbox 
          id="allDay" 
          checked={allDay} 
          onCheckedChange={(checked) => setAllDay(checked === true)}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="allDay"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Dia inteiro
          </label>
          <p className="text-xs text-muted-foreground">
            Bloqueie o dia todo ao invés de um horário específico.
          </p>
        </div>
      </div>

      {!allDay && (
        <div className="space-y-2">
          <Label htmlFor="time">Horário</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo (opcional)</Label>
        <Textarea
          id="reason"
          placeholder="Insira o motivo do bloqueio"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : blockedDate ? (
          "Atualizar Bloqueio"
        ) : (
          "Bloquear Horário"
        )}
      </Button>
    </form>
  );
};
