
import { useState, useEffect, useCallback } from "react";
import { Client, MessageTemplate } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useDataContext } from "./useDataContext";
import { supabase } from "@/integrations/supabase/client";

export function useWhatsAppMessage() {
  const [messageType, setMessageType] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const { generateWhatsAppLink } = useDataContext();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      console.log("useWhatsAppMessage: Iniciando busca de templates de mensagens");
      
      const { data, error } = await supabase
        .from('mensagens_templates')
        .select('*')
        .order('tipo', { ascending: true });
      
      if (error) {
        console.error("Erro ao buscar templates:", error);
        toast({
          title: "Erro ao carregar templates",
          description: "Não foi possível carregar os modelos de mensagens. Por favor, tente novamente.",
          variant: "destructive",
        });
        return [];
      }
      
      if (data && data.length > 0) {
        const mappedTemplates: MessageTemplate[] = data.map(item => ({
          id: item.id,
          type: item.tipo,
          message: item.mensagem,
          active: true
        }));
        
        setTemplates(mappedTemplates);
        console.log("Templates carregados:", mappedTemplates);
        
        // Define um tipo de mensagem padrão se disponível
        if (mappedTemplates.length > 0 && !messageType) {
          console.log("Definindo tipo de mensagem padrão:", mappedTemplates[0].type);
          setMessageType(mappedTemplates[0].type);
        }
        
        return mappedTemplates;
      } else {
        console.warn("Nenhum template de mensagem encontrado no banco de dados");
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar templates de mensagens:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar os modelos de mensagens",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast, messageType]);

  // Carregar templates quando o hook for inicializado
  useEffect(() => {
    fetchTemplates().then(loadedTemplates => {
      console.log(`useWhatsAppMessage: ${loadedTemplates.length} templates carregados inicialmente`);
      
      if (loadedTemplates.length > 0 && !messageType) {
        setMessageType(loadedTemplates[0].type);
        console.log("useWhatsAppMessage: Definido messageType padrão:", loadedTemplates[0].type);
      }
    });
    
    // Configurar listener para atualizações em tempo real dos templates
    const channel = supabase
      .channel('templates-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'mensagens_templates' }, 
          () => {
            console.log("useWhatsAppMessage: Mudança detectada na tabela de templates, atualizando...");
            fetchTemplates().then(loadedTemplates => {
              if (loadedTemplates.length > 0 && !messageType) {
                setMessageType(loadedTemplates[0].type);
                console.log("useWhatsAppMessage: MessageType atualizado após mudança:", loadedTemplates[0].type);
              }
            });
          })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTemplates, messageType]);

  const handleSendMessage = async () => {
    if (!selectedClient || !messageType) {
      toast({
        title: "Informações incompletas",
        description: "Selecione um cliente e um tipo de mensagem",
        variant: "destructive",
      });
      return false;
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
    loading,
    fetchTemplates,
    handleSendMessage
  };
}
