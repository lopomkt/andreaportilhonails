
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { MessageForm } from "./MessageForm";
import { useWhatsAppMessage } from "@/hooks/useWhatsAppMessage";
import { whatsappButtonStyles } from "./styles";
import { Loader2 } from "lucide-react";

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    messageType,
    setMessageType,
    selectedClient,
    setSelectedClient,
    templates,
    loading,
    fetchTemplates,
    handleSendMessage
  } = useWhatsAppMessage();

  // Carregar templates quando o componente é montado
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Recarregar templates quando o modal é aberto
  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, fetchTemplates]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isExpanded && !open) {
      timeoutId = setTimeout(() => {
        if (!open) {
          setIsExpanded(false);
        }
      }, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isExpanded, open]);

  return (
    <>
      <Button
        className={cn(
          whatsappButtonStyles.fixed,
          isExpanded ? whatsappButtonStyles.expanded : whatsappButtonStyles.collapsed
        )}
        onClick={() => {
          setOpen(true);
          fetchTemplates(); // Garantir que os templates sejam carregados ao abrir o modal
        }}
      >
        <Send className="h-6 w-6" />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <span className="mr-2">📲</span>
              Enviar Mensagem para Cliente
            </DialogTitle>
            <DialogDescription>
              Escolha um cliente e um tipo de mensagem para enviar
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <MessageForm 
              selectedClient={selectedClient}
              onClientSelect={setSelectedClient}
              messageType={messageType}
              onMessageTypeChange={setMessageType}
              templates={templates}
              onSend={handleSendMessage}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
