
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
  // Get unique message types from templates
  const messageTypes = [...new Set(templates.map(t => t.type))];
  
  // Group templates by type for easier rendering
  const groupedTemplates = messageTypes.reduce((acc, type) => {
    acc[type] = templates.filter(t => t.type === type);
    return acc;
  }, {} as Record<string, MessageTemplate[]>);

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "confirmação": return "Confirmação";
      case "lembrete": return "Lembrete";
      case "reengajamento": return "Reengajamento";
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
