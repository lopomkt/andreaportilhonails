
import React from "react";
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
  // Obter tipos de mensagem únicos a partir dos templates
  const messageTypes = [...new Set(templates.map(t => t.type))];
  
  // Agrupar templates por tipo para facilitar a renderização
  const groupedTemplates = messageTypes.reduce((acc, type) => {
    acc[type] = templates.filter(t => t.type === type);
    return acc;
  }, {} as Record<string, MessageTemplate[]>);

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "confirmação": return "Confirmação";
      case "lembrete": return "Lembrete";
      case "reengajamento": return "Reengajamento";
      case "aniversario": return "Aniversário";
      case "promocao": return "Promoção";
      default: return type;
    }
  };

  return (
    <div className="space-y-2">
      <Label>Tipo de Mensagem</Label>
      <Select value={messageType} onValueChange={onMessageTypeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o tipo de mensagem" />
        </SelectTrigger>
        <SelectContent>
          {messageTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {getTypeDisplayName(type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
