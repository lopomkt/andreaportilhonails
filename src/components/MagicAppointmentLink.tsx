import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, Copy, Sparkles } from "lucide-react";
import { Client, Service } from "@/types";
import { useData } from "@/context/DataProvider";
export function MagicAppointmentLink() {
  const {
    clients,
    services
  } = useData();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const {
    toast
  } = useToast();

  // Generate the magic appointment link
  const generateLink = () => {
    if (!selectedClient || !selectedService) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, selecione um cliente e um serviço",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would create a unique link with a token
    // For this example, we'll create a URL with query parameters
    const baseUrl = window.location.origin;
    const appointmentUrl = `${baseUrl}/calendario?cliente=${selectedClient}&servico=${selectedService}&magic=true`;
    setLink(appointmentUrl);
    toast({
      title: "Link gerado com sucesso",
      description: "O link mágico de agendamento foi criado! Compartilhe com sua cliente."
    });
  };

  // Copy link to clipboard
  const copyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência."
    });
  };

  // Share link via WhatsApp
  const shareViaWhatsApp = () => {
    if (!link || !selectedClient) return;
    const client = clients.find(c => c.id === selectedClient);
    if (!client || !client.phone) {
      toast({
        title: "Erro ao compartilhar",
        description: "O cliente selecionado não possui telefone cadastrado.",
        variant: "destructive"
      });
      return;
    }
    const service = services.find(s => s.id === selectedService);
    const message = `Olá ${client.name}! 😊 Aqui está o link para você agendar seu horário para ${service?.name || "nosso serviço"}. Basta clicar e escolher a data e horário que preferir: ${link}`;
    const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  return;
}