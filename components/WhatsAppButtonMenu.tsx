
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Client } from "@/types";

export function WhatsAppButtonMenu() {
  const [open, setOpen] = useState(false);
  const [messageType, setMessageType] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const { toast } = useToast();
  const { clients, generateWhatsAppLink } = useData();
  
  const handleSendMessage = async () => {
    if (!selectedClient || !messageType) {
      toast({
        title: "Informações incompletas",
        description: "Selecione um cliente e um tipo de mensagem",
        variant: "destructive",
      });
      return;
    }
    
    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;
    
    let messageData = {
      client,
      message: ""
    };
    
    // Use different templates based on message type
    switch (messageType) {
      case "confirmation":
        messageData.message = `Olá ${client.name}! 💅✨ Seu agendamento está confirmado. Estou ansiosa para te receber! Qualquer mudança, me avise com antecedência, ok? 💕`;
        break;
      case "reminder":
        messageData.message = `Oi ${client.name} 👋 Passando para lembrar do seu horário amanhã. Estou te esperando! Não se atrase, tá? 💖 Se precisar remarcar, me avise o quanto antes.`;
        break;
      case "reengagement":
        messageData.message = `Oi ${client.name}! 💕 Estou com saudades! Faz um tempinho que não te vejo por aqui. Que tal agendar um horário para cuidar das suas unhas? Tenho novidades que você vai amar! 💅✨ Me avisa quando quiser agendar!`;
        break;
      default:
        messageData.message = `Olá ${client.name}! 😊`;
    }
    
    const whatsappLink = await generateWhatsAppLink(messageData);
    if (whatsappLink) {
      window.open(whatsappLink, '_blank');
      setOpen(false);
      setSelectedClient("");
      setMessageType("");
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-24 right-6 rounded-full w-14 h-14 shadow-premium p-0 bg-green-500 hover:bg-green-600 transition-all duration-300 z-50"
        onClick={() => setOpen(true)}
        style={{ zIndex: 100 }}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="client">Cliente</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message-type">Tipo de Mensagem</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger id="message-type">
                  <SelectValue placeholder="Selecione um tipo de mensagem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmation">Confirmação</SelectItem>
                  <SelectItem value="reminder">Lembrete</SelectItem>
                  <SelectItem value="reengagement">Reengajamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleSendMessage} 
              className="w-full bg-green-500 hover:bg-green-600 mt-4"
              disabled={!selectedClient || !messageType}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Enviar pelo WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
