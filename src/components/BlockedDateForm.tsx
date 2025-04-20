
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { appointmentService } from '@/integrations/supabase/appointmentService';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Switch } from "@/components/ui/switch";
import { Loader } from 'lucide-react';

interface BlockedDateFormProps {
  onSuccess?: () => void;
  initialDate?: Date;
}

export function BlockedDateForm({ onSuccess, initialDate }: BlockedDateFormProps) {
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [reason, setReason] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { refetchBlockedDates } = useSupabaseData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    
    try {
      // Set the time for the date if it's not an all-day block
      const dateWithTime = new Date(date);
      
      if (!isAllDay) {
        const [hours, minutes] = time.split(':').map(Number);
        dateWithTime.setHours(hours, minutes, 0, 0);
      } else {
        // For all-day blocks, set time to 00:00
        dateWithTime.setHours(0, 0, 0, 0);
      }
      
      const blockedDate = await appointmentService.createBlockedDate({
        date: dateWithTime,
        reason: reason,
        allDay: isAllDay
      });
      
      if (blockedDate) {
        toast({
          title: "Sucesso",
          description: "Horário bloqueado com sucesso",
        });
        
        // Refresh blocked dates data
        await refetchBlockedDates();
        
        // Reset form
        if (!initialDate) {
          setDate(new Date());
        }
        setTime(format(new Date(), 'HH:mm'));
        setReason('');
        setIsAllDay(true);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível bloquear o horário",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error blocking date:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao bloquear o horário",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date selection */}
      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date"
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
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* All-day toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="all-day" className="cursor-pointer">Dia inteiro</Label>
        <Switch 
          id="all-day" 
          checked={isAllDay}
          onCheckedChange={setIsAllDay}
        />
      </div>
      
      {/* Time selection (only if not all day) */}
      {!isAllDay && (
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
      
      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason">Motivo (opcional)</Label>
        <Textarea
          id="reason"
          placeholder="Motivo do bloqueio"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>
      
      {/* Submit button */}
      <Button 
        type="submit" 
        className="w-full bg-rose-500 hover:bg-rose-600 text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : "Bloquear Horário"}
      </Button>
    </form>
  );
}
