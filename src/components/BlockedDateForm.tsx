
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, add, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BlockedDateFormProps {
  initialDate?: Date;
  onSuccess?: () => void;
}

export function BlockedDateForm({ initialDate, onSuccess }: BlockedDateFormProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [startTime, setStartTime] = useState(format(new Date(), 'HH:mm'));
  const [endTime, setEndTime] = useState(format(add(new Date(), { hours: 1 }), 'HH:mm'));
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate time slots from 07:00 to 19:00 in 30-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 7; hour <= 19; hour++) {
      options.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 19) {
        options.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione uma data para bloquear.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create date with time
      const blockedDate = new Date(date);
      if (!isAllDay) {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        blockedDate.setHours(startHour, startMinute, 0, 0);
      } else {
        // If all day, set to start of day
        blockedDate.setHours(0, 0, 0, 0);
      }
      
      // For end time
      let blockedEndDate = null;
      if (!isAllDay) {
        blockedEndDate = new Date(date);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        blockedEndDate.setHours(endHour, endMinute, 0, 0);
      }

      const { data, error } = await supabase
        .from('datas_bloqueadas')
        .insert({
          data: blockedDate.toISOString(),
          motivo: reason || null,
          descricao: description || null,
          dia_todo: isAllDay,
          valor: value || null,
        });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Data bloqueada",
        description: "Período bloqueado com sucesso!",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error blocking date:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível bloquear esta data.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP', { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="allDay" 
          checked={isAllDay} 
          onCheckedChange={(checked) => setIsAllDay(checked === true)}
        />
        <label
          htmlFor="allDay"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Bloquear o dia inteiro
        </label>
      </div>

      {!isAllDay && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Hora inicial</Label>
            <Select
              value={startTime}
              onValueChange={setStartTime}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endTime">Hora final</Label>
            <Select
              value={endTime}
              onValueChange={setEndTime}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={`end-${time}`} value={time}
                    disabled={time <= startTime}
                  >
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Título do bloqueio"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo</Label>
        <Textarea 
          id="reason" 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          placeholder="Motivo do bloqueio"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Valor (opcional)</Label>
        <Input 
          id="value" 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          placeholder="Valor associado (se aplicável)"
        />
      </div>

      <div className="pt-4 flex justify-end">
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">Processando...</span>
              <span className="animate-spin">⏳</span>
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Bloquear Horário
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
