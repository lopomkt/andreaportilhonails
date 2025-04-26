
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { MessageTemplate } from "@/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MessageTypeSelectProps {
  messageType: string;
  onMessageTypeChange: (value: string) => void;
  templates: MessageTemplate[];
}

export function MessageTypeSelect({
  messageType,
  onMessageTypeChange,
  templates
}: MessageTypeSelectProps) {
  // Get unique message types from templates
  const messageTypes = [...new Set(templates.map(t => t.type))];
  
  // Group templates by type for easier rendering
  const groupedTemplates = messageTypes.reduce((acc, type) => {
    acc[type] = templates.filter(t => t.type === type);
    return acc;
  }, {} as Record<string, MessageTemplate[]>);

  // Set default message type if none is selected
  useEffect(() => {
    if (messageTypes.length > 0 && !messageType) {
      console.log("MessageTypeSelect: Setting default message type", messageTypes[0]);
      onMessageTypeChange(messageTypes[0]);
    }
  }, [templates, messageType, onMessageTypeChange, messageTypes]);

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "confirmação": return "Confirmação";
      case "lembrete": return "Lembrete";
      case "reengajamento": return "Reengajamento";
      case "aniversario": return "Aniversário";
      case "promocao": return "Promoção";
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Log message types when component renders or when templates/messageType change
  useEffect(() => {
    console.log("MessageTypeSelect: Templates disponíveis:", templates.length);
    console.log("MessageTypeSelect: Tipos de mensagem disponíveis:", messageTypes);
    console.log("MessageTypeSelect: Tipo selecionado:", messageType);
  }, [templates, messageTypes, messageType]);

  return (
    <div className="space-y-2">
      <Label>Tipo de Mensagem</Label>
      <Select 
        value={messageType} 
        onValueChange={onMessageTypeChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o tipo de mensagem" />
        </SelectTrigger>
        <SelectContent>
          {messageTypes.length > 0 ? (
            messageTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {getTypeDisplayName(type)}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-1 text-sm text-muted-foreground">
              Nenhum tipo de mensagem disponível
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
