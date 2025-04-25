
import React from "react";
import { Label } from "@/components/ui/label";
import { MessageTemplate } from "@/types";
import { whatsappPreviewStyles } from "./styles";

interface MessagePreviewProps {
  messageType: string;
  templates: MessageTemplate[];
  clientName?: string;
}

export function MessagePreview({ messageType, templates, clientName }: MessagePreviewProps) {
  if (!messageType) return null;

  const template = templates.find(t => t.id === messageType);
  if (!template) return null;

  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={whatsappPreviewStyles.container}>
      <Label>Prévia da mensagem:</Label>
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className={whatsappPreviewStyles.previewBox}>
          <div className={whatsappPreviewStyles.tail} />
          <p className={whatsappPreviewStyles.bubble}>
            {template.message.replace(/{{nome}}/g, clientName || '[nome do cliente]')}
          </p>
          <div className={whatsappPreviewStyles.timestamp}>{currentTime}</div>
        </div>
      </div>
    </div>
  );
}
