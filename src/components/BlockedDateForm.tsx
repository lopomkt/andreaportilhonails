import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { BlockedDateService } from '@/integrations/supabase/blockedDateService';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  date: z.date({
    required_error: "Uma data é necessária.",
  }),
  reason: z.string().optional(),
  allDay: z.boolean().default(false).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BlockedDateFormProps {
  onSuccess?: () => void;
  initialDate?: Date;
}

export function BlockedDateForm({ onSuccess, initialDate }: BlockedDateFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refetchBlockedDates } = useSupabaseData();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialDate || new Date(),
      reason: '',
      allDay: false,
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const success = await BlockedDateService.create({
        date: data.date.toISOString(),
        reason: data.reason,
        allDay: data.allDay
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: "Data bloqueada com sucesso!",
        });
        await refetchBlockedDates();
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao bloquear a data. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create blocked date:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao bloquear a data. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data*</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setDate(new Date().getDate() - 1))
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allDay"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-md border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Dia todo</FormLabel>
                <FormDescription>
                  Bloquear o dia inteiro.
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Motivo do bloqueio"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full bg-gray-500 hover:bg-gray-600 text-white">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Bloquear data
        </Button>
      </form>
    </Form>
  );
}
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FormDescription } from "@/components/ui/form"
