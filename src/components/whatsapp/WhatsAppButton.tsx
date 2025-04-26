
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
import { useServices } from "@/context/ServiceContext";
import { toast } from "@/hooks/use-toast";

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { services, fetchServices, loading: servicesLoading } = useServices();
  const {
    messageType,
    setMessageType,
    selectedClient,
    setSelectedClient,
    templates,
    loading: messageLoading,
    fetchTemplates,
    handleSendMessage
  } = useWhatsAppMessage();
  
  const [loading, setLoading] = useState(false);

  // Load templates and services when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("WhatsAppButton: Inicializando dados...");
        setLoading(true);
        
        // Load templates and services in parallel
        const [templatesResult, servicesResult] = await Promise.all([
          fetchTemplates(), 
          fetchServices()
        ]);
        
        console.log("WhatsAppButton: Templates carregados:", templates.length);
        console.log("WhatsAppButton: Serviços carregados:", services.length);
        console.log("WhatsAppButton: Dados inicializados com sucesso");
      } catch (error) {
        console.error("WhatsAppButton: Erro ao inicializar dados:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar todos os dados necessários",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, [fetchTemplates, fetchServices]);

  // Reload templates and services when modal is opened
  useEffect(() => {
    if (open) {
      const refreshData = async () => {
        try {
          console.log("WhatsAppButton: Modal aberto, atualizando dados...");
          setLoading(true);
          
          // Reload both templates and services
          await Promise.all([
            fetchTemplates().then(() => {
              console.log("WhatsAppButton: Templates atualizados no modal:", templates.length);
            }),
            fetchServices().then(() => {
              console.log("WhatsAppButton: Serviços atualizados no modal:", services.length);
            })
          ]);
          
          console.log("WhatsAppButton: Dados atualizados no modal");
        } catch (error) {
          console.error("WhatsAppButton: Erro ao atualizar dados no modal:", error);
        } finally {
          setLoading(false);
        }
      };
      
      refreshData();
    }
  }, [open, fetchTemplates, fetchServices]);

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
    setIsExpanded(true);
  };

  return (
    <>
      <Button
        className={cn(
          whatsappButtonStyles.fixed,
          isExpanded ? whatsappButtonStyles.expanded : whatsappButtonStyles.collapsed
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
          
          {loading || messageLoading || servicesLoading ? (
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
              services={services}
              onSend={handleSendMessage}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
