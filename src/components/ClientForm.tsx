
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types";
import { Loader2 } from "lucide-react";
import { useData } from "@/context/DataContext";

interface ClientFormProps {
  client?: Client;
  onSuccess?: (client: Client) => void;
  onCancel?: () => void;
  initialName?: string;
  onDelete?: () => void;
}

const ClientForm = ({ client, onSuccess, onCancel, initialName = "", onDelete }: ClientFormProps) => {
  const [name, setName] = useState(client?.name || initialName);
  const [phone, setPhone] = useState(client?.phone || "");
  const [email, setEmail] = useState(client?.email || "");
  const [birthdate, setBirthdate] = useState<Date | null>(client?.birthdate ? new Date(client.birthdate) : null);
  const [notes, setNotes] = useState(client?.notes || "");
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const { refetchClients } = useData?.() || {}; // Use optional chaining for safety

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    
    try {
      const clientData = {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        birthdate: birthdate ? birthdate.toISOString() : null,
        notes: notes?.trim() || null
      };

      // If editing an existing client
      if (client?.id) {
        const { data, error } = await supabase
          .from("clientes")
          .update({
            nome: clientData.name,
            telefone: clientData.phone,
            email: clientData.email,
            data_nascimento: clientData.birthdate,
            observacoes: clientData.notes
          })
          .eq("id", client.id)
          .select();

        if (error) {
          throw error;
        }

        toast({
          title: "Cliente atualizado",
          description: `Cliente ${name} foi atualizado com sucesso!`
        });

        if (onSuccess && data?.[0]) {
          const updatedClient: Client = {
            ...client,
            name: data[0].nome,
            phone: data[0].telefone,
            email: data[0].email || "",
            birthdate: data[0].data_nascimento,
            notes: data[0].observacoes || ""
          };
          
          if (refetchClients) {
            refetchClients();
          }
          
          onSuccess(updatedClient);
        }
      } else {
        // Creating a new client
        const { data, error } = await supabase
          .from("clientes")
          .insert({
            nome: clientData.name,
            telefone: clientData.phone,
            email: clientData.email,
            data_nascimento: clientData.birthdate,
            observacoes: clientData.notes
          })
          .select();

        if (error) {
          throw error;
        }

        // Get the newly created client
        const newClient = data?.[0];

        toast({
          title: "Cliente cadastrado",
          description: `Cliente ${name} foi cadastrado com sucesso!`,
          action: (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.href = `/clientes?id=${newClient.id}`}>
                Ver cliente
              </Button>
            </div>
          )
        });

        // Reset the form
        setName("");
        setPhone("");
        setEmail("");
        setBirthdate(null);
        setNotes("");
        
        // Call onSuccess with the newly created client
        if (onSuccess && newClient) {
          const client: Client = {
            id: newClient.id,
            name: newClient.nome,
            phone: newClient.telefone,
            email: newClient.email || "",
            birthdate: newClient.data_nascimento,
            notes: newClient.observacoes || "",
            lastAppointment: null,
            totalSpent: 0,
            createdAt: newClient.data_criacao
          };
          
          // Refresh the clients list in the context if the function exists
          if (refetchClients) {
            refetchClients();
          }
          
          onSuccess(client);
        }
      }
    } catch (error) {
      console.error("Error saving client:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o cliente. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          placeholder="Nome do cliente"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          placeholder="Telefone do cliente"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Email do cliente (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Data de Nascimento</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !birthdate && "text-muted-foreground"
              )}
            >
              {birthdate ? format(birthdate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={birthdate}
              onSelect={setBirthdate}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Observações adicionais (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        {onDelete && client && (
          <Button 
            type="button" 
            variant="destructive" 
            className="sm:mr-auto"
            onClick={onDelete}
          >
            Excluir Cliente
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            client ? "Salvar alterações" : "Cadastrar Cliente"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
