
import { useState, useEffect } from "react";
import { Client, MessageTemplate } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useDataContext } from "./useDataContext";
import { supabase } from "@/integrations/supabase/client";

export function useWhatsAppMessage() {
  const [messageType, setMessageType] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const { toast } = useToast();
  const { generateWhatsAppLink } = useDataContext();

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('mensagens_templates')
        .select('*')
        .order('tipo', { ascending: true });
      
      if (error) {
        console.error("Erro ao buscar templates:", error);
        return;
      }
      
      if (data) {
        const mappedTemplates: MessageTemplate[] = data.map(item => ({
          id: item.id,
          type: item.tipo,
          message: item.mensagem,
          active: true
        }));
        
        setTemplates(mappedTemplates);
        
        // Define um tipo de mensagem padrão se disponível
        if (mappedTemplates.length > 0 && !messageType) {
          setMessageType(mappedTemplates[0].type);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar templates de mensagens:", error);
    }
  };

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
      // Obter todos os templates para o tipo de mensagem selecionado
      const typeTemplates = templates.filter(template => template.type === messageType);
      
      // Utilizar o primeiro template do tipo selecionado
      const selectedTemplate = typeTemplates.length > 0 ? typeTemplates[0] : null;
      
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
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error generating WhatsApp link:", error);
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível gerar o link para o WhatsApp",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    messageType,
    setMessageType,
    selectedClient,
    setSelectedClient,
    templates,
    fetchTemplates,
    handleSendMessage
  };
}
