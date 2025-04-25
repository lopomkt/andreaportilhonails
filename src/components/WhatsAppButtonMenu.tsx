
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
import { Client } from "@/types";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

export function WhatsAppButtonMenu() {
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messageType, setMessageType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const { clients = [], generateWhatsAppLink } = useData();
  
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
    
    let messageData = {
      client: selectedClient,
      message: ""
    };
    
    switch (messageType) {
      case "confirmation":
        messageData.message = `Olá ${selectedClient.name}! 💅✨ Seu agendamento está confirmado. Estou ansiosa para te receber! Qualquer mudança, me avise com antecedência, ok? 💕`;
        break;
      case "reminder":
        messageData.message = `Oi ${selectedClient.name} 👋 Passando para lembrar do seu horário amanhã. Estou te esperando! Não se atrase, tá? 💖 Se precisar remarcar, me avise o quanto antes.`;
        break;
      case "reengagement":
        messageData.message = `Oi ${selectedClient.name}! 💕 Estou com saudades! Faz um tempinho que não te vejo por aqui. Que tal agendar um horário para cuidar das suas unhas? Tenho novidades que você vai amar! 💅✨ Me avisa quando quiser agendar!`;
        break;
      default:
        messageData.message = `Olá ${selectedClient.name}! 😊`;
    }
    
    try {
      const whatsappLink = await generateWhatsAppLink(messageData);
      if (whatsappLink) {
        window.open(whatsappLink, '_blank');
        setOpen(false);
        setSelectedClient(null);
        setMessageType("");
        setSearchTerm("");
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

  // Ensure clients is an array and safely filter it
  const safeClients = Array.isArray(clients) ? clients : [];
  const filteredClients = safeClients.filter(client => 
    client && typeof client === 'object' && 
    (
      (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm))
    )
  );

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
              {/* Make sure the Command component has an empty view if needed */}
              <Command className="rounded-lg border shadow-md">
                <CommandInput 
                  placeholder="Digite o nome do cliente..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                <CommandGroup className="max-h-48 overflow-auto">
                  {filteredClients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={client.id}
                      onSelect={() => {
                        setSelectedClient(client);
                        setSearchTerm(client.name || '');
                      }}
                      className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.phone}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Mensagem</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "confirmation", label: "Confirmação" },
                  { id: "reminder", label: "Lembrete" },
                  { id: "reengagement", label: "Reengajamento" }
                ].map((type) => (
                  <Button
                    key={type.id}
                    variant={messageType === type.id ? "default" : "outline"}
                    onClick={() => setMessageType(type.id)}
                    className={cn(
                      "justify-start",
                      messageType === type.id && "bg-green-500 hover:bg-green-600 text-white"
                    )}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
            
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
