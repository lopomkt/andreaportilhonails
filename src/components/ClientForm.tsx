
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { verifySupabaseConnection } from "@/utils/supabaseConnectionCheck";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  nome: z.string().min(2, { message: 'Nome é obrigatório' }),
  telefone: z.string().min(10, { message: 'Telefone inválido' }),
  dataNascimento: z.date().optional(),
  observacoes: z.string().optional(),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  onSuccess?: (clientId: string, clientName: string) => void;
  onCancel?: () => void;
  initialName?: string; // Add this line to accept initialName
}

export function ClientForm({ onSuccess, onCancel, initialName = '' }: ClientFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialName, // Use initialName here
      telefone: '',
      observacoes: '',
      email: '',
    },
  });

  useEffect(() => {
    // Focus on the first field when component mounts
    const nameInput = document.getElementById('client-name-input');
    if (nameInput) {
      nameInput.focus();
    }
  }, []);

  // Format phone number as user types
  const formatPhone = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Apply mask based on length
    if (numericValue.length <= 2) {
      return numericValue;
    } else if (numericValue.length <= 6) {
      return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
    } else if (numericValue.length <= 10) {
      return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 6)}-${numericValue.slice(6)}`;
    } else {
      return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7, 11)}`;
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Verify Supabase connection
      const isConnected = await verifySupabaseConnection();
      if (!isConnected) {
        setIsSubmitting(false);
        return;
      }
      
      // Format phone number for storage (remove non-numeric characters)
      const formattedPhone = data.telefone.replace(/\D/g, '');
      
      const { data: clientData, error } = await supabase
        .from('clientes')
        .insert([
          {
            nome: data.nome,
            telefone: formattedPhone,
            observacoes: data.observacoes || null,
            email: data.email || null,
            // Convert date to ISO string if it exists
            data_nascimento: data.dataNascimento ? new Date(data.dataNascimento).toISOString() : null,
          }
        ])
        .select();
      
      if (error) {
        console.error("Error creating client:", error);
        toast({
          title: "Erro ao cadastrar cliente",
          description: "Ocorreu um erro ao cadastrar o cliente. Tente novamente.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      toast({
        title: "Cliente cadastrado",
        description: "Cliente cadastrado com sucesso!",
      });
      
      if (onSuccess && clientData && clientData.length > 0) {
        onSuccess(clientData[0].id, clientData[0].nome);
      }
      
    } catch (err) {
      console.error("Unexpected error creating client:", err);
      toast({
        title: "Erro ao cadastrar cliente",
        description: "Ocorreu um erro ao cadastrar o cliente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome*</FormLabel>
              <FormControl>
                <Input 
                  id="client-name-input"
                  placeholder="Nome do cliente" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp*</FormLabel>
              <FormControl>
                <Input 
                  placeholder="(00) 00000-0000" 
                  {...field} 
                  onChange={(e) => {
                    const formattedValue = formatPhone(e.target.value);
                    field.onChange(formattedValue);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="dataNascimento"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de nascimento</FormLabel>
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
                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                      date > new Date() || date < new Date("1900-01-01")
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações sobre o cliente" 
                  className="resize-none" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-rose-500 hover:bg-rose-600"
          >
            {isSubmitting ? "Salvando..." : "Salvar cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
