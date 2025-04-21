import React, { useState } from "react";
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

interface ClientFormProps {
  onSuccess?: (client: Client) => void;
}

const ClientForm = ({ onSuccess }: ClientFormProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

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
        description: `Cliente ${name} foi cadastrado com sucesso!`
      });

      // Reset the form
      setName("");
      setPhone("");
      setEmail("");
      setBirthdate(null);
      setNotes("");
      
      // Call onSuccess with the newly created client to update the parent component
      if (onSuccess && newClient) {
        onSuccess({
          id: newClient.id,
          name: newClient.nome,
          phone: newClient.telefone,
          email: newClient.email || "",
          birthdate: newClient.data_nascimento,
          notes: newClient.observacoes || "",
          lastAppointment: null,
          totalSpent: 0
        });
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao cadastrar o cliente. Tente novamente.",
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
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Cadastrar Cliente"
        )}
      </Button>
    </form>
  );
};

export default ClientForm;
