import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { ClientAutocomplete } from "@/components/ClientAutocomplete";
import { Client, MessageTemplate } from "@/types";
import { MessagePreview } from "./MessagePreview";
import { MessageTypeSelect } from "./MessageTypeSelect";
import { whatsappButtonStyles } from "./styles";

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
      
      <MessageTypeSelect 
        messageType={messageType}
        onMessageTypeChange={onMessageTypeChange}
        templates={templates}
      />
      
      <MessagePreview 
        messageType={messageType} 
        templates={templates}
        clientName={selectedClient?.name}
      />
      
      <Button 
        onClick={onSend} 
        className={whatsappButtonStyles.send}
        disabled={!selectedClient || !messageType}
      >
        <Send className="mr-2 h-4 w-4" />
        Enviar pelo WhatsApp
      </Button>
    </div>
  );
}
