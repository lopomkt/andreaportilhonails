
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { ClientAutocomplete } from "@/components/ClientAutocomplete";
import { Client, MessageTemplate } from "@/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessagePreview } from "./MessagePreview";

interface MessageFormProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client | null) => void;
  messageType: string;
  onMessageTypeChange: (value: string) => void;
  templates: MessageTemplate[];
  onSend: () => void;
}

export function MessageForm({
  selectedClient,
  onClientSelect,
  messageType,
  onMessageTypeChange,
  templates,
  onSend
}: MessageFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Cliente</Label>
        <ClientAutocomplete 
          onClientSelect={onClientSelect}
          selectedClient={selectedClient}
          autofocus={true}
          placeholder="Digite o nome do cliente..."
        />
      </div>
      
      <div className="space-y-2">
        <Label>Tipo de Mensagem</Label>
        <Select value={messageType} onValueChange={onMessageTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo de mensagem" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>
                {template.type === "confirmação" && "Confirmação"}
                {template.type === "lembrete" && "Lembrete"}
                {template.type === "reengajamento" && "Reengajamento"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <MessagePreview 
        messageType={messageType} 
        templates={templates}
        clientName={selectedClient?.name}
      />
      
      <Button 
        onClick={onSend} 
        className="w-full bg-green-500 hover:bg-green-600 mt-4"
        disabled={!selectedClient || !messageType}
      >
        <Send className="mr-2 h-4 w-4" />
        Enviar pelo WhatsApp
      </Button>
    </div>
  );
}
