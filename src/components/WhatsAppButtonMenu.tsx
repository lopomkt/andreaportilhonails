
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Client, MessageTemplate } from "@/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientAutocomplete } from "@/components/ClientAutocomplete";
import { supabase } from "@/integrations/supabase/client";

export function WhatsAppButtonMenu() {
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messageType, setMessageType] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const { toast } = useToast();
  const { clients = [], generateWhatsAppLink } = useData();
  
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('mensagens_templates')
          .select('*');
        
        if (error) {
          console.error("Erro ao buscar templates:", error);
          return;
        }
        
        if (data) {
          const mappedTemplates: MessageTemplate[] = data.map(item => ({
            id: item.id,
            type: item.tipo,
            message: item.mensagem,
            active: true // Default to true since we don't have this in the DB
          }));
          
          setTemplates(mappedTemplates);
        }
      } catch (error) {
        console.error("Erro ao buscar templates de mensagens:", error);
      }
    };

    fetchTemplates();
  }, []);
  
  const resetButton = useCallback(() => {
    if (!open) {
      setIsExpanded(false);
    }
  }, [open]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isExpanded && !open) {
      timeoutId = setTimeout(resetButton, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isExpanded, open, resetButton]);

  const handleSendMessage = async () => {
    if (!selectedClient || !messageType) {
      toast({
        title: "Informações incompletas",
        description: "Selecione um cliente e um tipo de mensagem",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const selectedTemplate = templates.find(template => template.id === messageType);
      if (!selectedTemplate) {
        throw new Error("Modelo de mensagem não encontrado");
      }
      
      let messageContent = selectedTemplate.message.replace(/{{nome}}/g, selectedClient.name || '');
      
      const messageData = {
        client: selectedClient,
        message: messageContent
      };
      
      if (!generateWhatsAppLink) {
        throw new Error("Função de geração de link não disponível");
      }
      
      const whatsappLink = await generateWhatsAppLink(messageData);
      if (whatsappLink) {
        window.open(whatsappLink, '_blank');
        setOpen(false);
        setSelectedClient(null);
        setMessageType("");
      }
    } catch (error) {
      console.error("Error generating WhatsApp link:", error);
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível gerar o link para o WhatsApp",
        variant: "destructive",
      });
    }
  };

  const handleButtonClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }
    setOpen(true);
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
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <ClientAutocomplete 
                onClientSelect={setSelectedClient}
                selectedClient={selectedClient}
                autofocus={true}
                placeholder="Digite o nome do cliente..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Mensagem</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo de mensagem" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {messageType && (
              <div className="space-y-2 pt-2">
                <Label>Prévia da mensagem:</Label>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm whitespace-pre-wrap">
                    {templates.find(t => t.id === messageType)?.message
                      .replace(/{{nome}}/g, selectedClient?.name || '[nome do cliente]')}
                  </p>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleSendMessage} 
              className="w-full bg-green-500 hover:bg-green-600 mt-4"
              disabled={!selectedClient || !messageType}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar pelo WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
