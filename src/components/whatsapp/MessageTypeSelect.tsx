
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
  return (
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
  );
}
