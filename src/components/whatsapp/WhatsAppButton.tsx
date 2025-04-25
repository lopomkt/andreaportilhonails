
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

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    messageType,
    setMessageType,
    selectedClient,
    setSelectedClient,
    templates,
    fetchTemplates,
    handleSendMessage
  } = useWhatsAppMessage();

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

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

  const handleButtonClick = () => {
    setOpen(true);
  };

  const onSend = async () => {
    const success = await handleSendMessage();
    if (success) {
      setOpen(false);
      setSelectedClient(null);
      setMessageType("");
    }
  };

  return (
    <>
      <Button
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full shadow-premium p-0 bg-green-500 hover:bg-green-600 transition-all duration-300 z-10 md:z-40 md:bottom-6 md:right-6 md:left-auto md:translate-x-0",
          isExpanded ? "w-14 h-14" : "w-14 md:w-14 h-7 md:h-14 translate-y-7 md:translate-y-0"
        )}
        onClick={handleButtonClick}
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
          
          <MessageForm 
            selectedClient={selectedClient}
            onClientSelect={setSelectedClient}
            messageType={messageType}
            onMessageTypeChange={setMessageType}
            templates={templates}
            onSend={onSend}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
