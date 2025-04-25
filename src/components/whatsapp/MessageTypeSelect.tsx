
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
  // Group templates by type for easier rendering
  const groupedTemplates: { [key: string]: MessageTemplate[] } = {
    confirmação: templates.filter(t => t.type === "confirmação"),
    lembrete: templates.filter(t => t.type === "lembrete"),
    reengajamento: templates.filter(t => t.type === "reengajamento")
  };

  return (
    <div className="space-y-2">
      <Label>Tipo de Mensagem</Label>
      <Select value={messageType} onValueChange={onMessageTypeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o tipo de mensagem" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(groupedTemplates).map(([type, templateList]) => (
            templateList.map(template => (
              <SelectItem key={template.id} value={template.id}>
                {type === "confirmação" && "Confirmação"}
                {type === "lembrete" && "Lembrete"}
                {type === "reengajamento" && "Reengajamento"}
              </SelectItem>
            ))
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
