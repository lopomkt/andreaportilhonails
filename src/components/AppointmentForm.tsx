
import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addHours, setHours, setMinutes } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useData } from '@/context/DataProvider';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
import { Appointment, Client, Service } from '@/types';
import { ClientSearch } from './clients/ClientSearch';
import { calculateEndTimeFromDate } from '@/lib/dateUtils';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  serviceId: z.string().min(1, "Serviço é obrigatório"),
  date: z.date({
    required_error: "Data é obrigatória",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  price: z.coerce.number().min(0, "Preço não pode ser negativo"),
  notes: z.string().optional(),
});

interface AppointmentFormProps {
  initialDate?: Date;
  appointment?: Appointment | null;
  onSuccess?: () => void;
}

export function AppointmentForm({ initialDate, appointment, onSuccess }: AppointmentFormProps) {
  const { services } = useData();
  const { selectedClient } = useAppointmentsModal();
  const { addAppointment, updateAppointment } = useData();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedClient, setSelectedClientState] = useState<Client | null>(null);

  const isEditMode = !!appointment;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      serviceId: "",
      date: initialDate || new Date(),
      time: format(initialDate || new Date(), "HH:mm"),
      price: 0,
      notes: "",
    },
  });

  // Set initial form values based on appointment or selected client
  useEffect(() => {
    if (appointment) {
      // We're editing an existing appointment
      const appointmentDate = new Date(appointment.date);
      
      form.reset({
        clientId: appointment.clientId,
        serviceId: appointment.serviceId,
        date: appointmentDate,
        time: format(appointmentDate, "HH:mm"),
        price: appointment.price,
        notes: appointment.notes || "",
      });

      // Find the service for this appointment
      const matchingService = services.find(service => service.id === appointment.serviceId);
      if (matchingService) {
        setSelectedService(matchingService);
      }

      // Set selected client if available
      if (appointment.client) {
        setSelectedClientState(appointment.client);
      }
    } else if (selectedClient) {
      // New appointment with pre-selected client
      form.setValue("clientId", selectedClient.id);
      setSelectedClientState(selectedClient);
    }

    if (initialDate) {
      form.setValue("date", initialDate);
      form.setValue("time", format(initialDate, "HH:mm"));
    }
  }, [appointment, selectedClient, initialDate, form, services]);

  // Update price when service is selected
  useEffect(() => {
    if (selectedService && !isEditMode) {
      form.setValue("price", selectedService.price);
    }
  }, [selectedService, form, isEditMode]);

  // Handle form submission
  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(":").map(Number);
      const appointmentDate = new Date(data.date);
      appointmentDate.setHours(hours, minutes, 0, 0);

      // Calculate end time based on service duration
      const serviceDuration = selectedService?.durationMinutes || 60;
      const endTime = calculateEndTimeFromDate(appointmentDate, serviceDuration);

      if (isEditMode && appointment) {
        // Update existing appointment
        await updateAppointment(appointment.id, {
          clientId: data.clientId,
          serviceId: data.serviceId,
          date: appointmentDate,
          endTime,
          price: data.price,
          notes: data.notes,
        });

        toast({
          title: "Agendamento atualizado",
          description: "Agendamento atualizado com sucesso!",
        });
      } else {
        // Create new appointment
        await addAppointment({
          clientId: data.clientId,
          serviceId: data.serviceId,
          date: appointmentDate,
          endTime,
          price: data.price,
          notes: data.notes,
          status: "pending",
        });

        toast({
          title: "Agendamento criado",
          description: "Agendamento criado com sucesso!",
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o agendamento",
        variant: "destructive",
      });
    }
  }

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      // Only update price if not in edit mode or if user hasn't manually changed it
      if (!isEditMode) {
        form.setValue("price", service.price);
      }
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClientState(client);
    form.setValue("clientId", client.id);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Client selection */}
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Cliente</FormLabel>
              <ClientSearch 
                selectedClient={selectedClient} 
                onClientSelect={handleClientSelect} 
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Service selection */}
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleServiceChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className="pl-3 text-left font-normal"
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
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time selection */}
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type="time"
                      className="pl-10"
                      min="07:00"
                      max="19:00"
                    />
                  </FormControl>
                  <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price */}
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Observações adicionais" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            {isEditMode ? "Atualizar" : "Agendar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
