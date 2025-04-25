
import React from "react";
import { Label } from "@/components/ui/label";
import { MessageTemplate } from "@/types";

interface MessagePreviewProps {
  messageType: string;
  templates: MessageTemplate[];
  clientName?: string;
}

export function MessagePreview({ messageType, templates, clientName }: MessagePreviewProps) {
  if (!messageType) return null;

  const template = templates.find(t => t.id === messageType);
  if (!template) return null;

  return (
    <div className="space-y-2 pt-2">
      <Label>Prévia da mensagem:</Label>
      <div className="p-3 rounded-lg bg-muted">
        <p className="text-sm whitespace-pre-wrap">
          {template.message.replace(/{{nome}}/g, clientName || '[nome do cliente]')}
        </p>
      </div>
    </div>
  );
}
