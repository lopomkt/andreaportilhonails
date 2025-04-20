
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  initialName?: string;
}

export function ClientForm({ onSuccess, onCancel, initialName = '' }: ClientFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthDay, setBirthDay] = useState<string>("");
  const [birthMonth, setBirthMonth] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialName,
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

  // Generate options for day, month, and year dropdowns
  const daysOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  const monthsOptions = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const currentYear = new Date().getFullYear();
  const yearsOptions = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  // Update form with birthdate
  useEffect(() => {
    if (birthDay && birthMonth && birthYear) {
      const dateString = `${birthYear}-${birthMonth}-${birthDay}`;
      const birthDate = new Date(dateString);
      
      if (!isNaN(birthDate.getTime())) {
        form.setValue('dataNascimento', birthDate);
      }
    }
  }, [birthDay, birthMonth, birthYear, form]);

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

  const checkClientExists = async (name: string, phone: string) => {
    try {
      const formattedPhone = phone.replace(/\D/g, '');
      
      const { data } = await supabase
        .from('clientes')
        .select('id, nome, telefone')
        .eq('nome', name)
        .eq('telefone', formattedPhone)
        .limit(1);
      
      return data && data.length > 0;
    } catch (err) {
      console.error("Error checking client existence:", err);
      return false;
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
      
      // Check if client already exists
      const clientExists = await checkClientExists(data.nome, formattedPhone);
      if (clientExists) {
        toast({
          title: "Cliente já cadastrado",
          description: "Já existe um cliente com este nome e telefone.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
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
        
        <FormItem className="flex flex-col">
          <FormLabel>Data de nascimento</FormLabel>
          <div className="flex gap-2">
            <Select value={birthDay} onValueChange={setBirthDay}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Dia" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                {daysOptions.map(day => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={birthMonth} onValueChange={setBirthMonth}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {monthsOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={birthYear} onValueChange={setBirthYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                {yearsOptions.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FormItem>
        
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
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isSubmitting ? "Salvando..." : "Salvar cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
