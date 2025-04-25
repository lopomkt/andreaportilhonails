
import { useCallback } from 'react';
import { format } from 'date-fns';
import { WhatsAppMessageData } from '@/types';

export function useWhatsAppLink() {
  const generateWhatsAppLink = useCallback(async ({ 
    client, 
    message, 
    appointment 
  }: WhatsAppMessageData): Promise<string> => {
    if (!client || !client.phone) {
      throw new Error("Cliente ou número de telefone não fornecido");
    }
    
    let messageText = message || "";
    
    // Replace template variables with actual values
    const replaceVariables = (text: string) => {
      if (!text) return "";
      
      let result = text;
      
      // Substituir variáveis relacionadas ao cliente
      if (client) {
        result = result.replace(/{{nome}}/g, client.name || "");
      }
      
      // Substituir variáveis relacionadas ao agendamento
      if (appointment) {
        result = result
          .replace(/{{serviço}}/g, appointment.service?.name || "")
          .replace(/{{data}}/g, appointment.date ? format(new Date(appointment.date), 'dd/MM/yyyy') : "")
          .replace(/{{horário}}/g, appointment.date ? format(new Date(appointment.date), 'HH:mm') : "")
          .replace(/{{valor}}/g, appointment.price ? `R$ ${appointment.price}` : "");
      }
      
      return result;
    };

    messageText = replaceVariables(messageText);
    
    // Mensagem padrão caso nenhuma seja fornecida
    if (!messageText) {
      if (appointment) {
        const appointmentDate = new Date(appointment.date);
        const serviceType = appointment.service?.name || "serviço";
        
        messageText = `Olá ${client.name || "Cliente"}, confirmando seu agendamento de ${serviceType} para o dia ${format(appointmentDate, 'dd/MM/yyyy')} às ${format(appointmentDate, 'HH:mm')}.`;
      } else {
        messageText = `Olá ${client.name || "Cliente"}!`;
      }
    }
    
    // Format phone number by removing any non-numeric characters
    const formattedPhone = client.phone.replace(/\D/g, '');
    
    // Ensure the phone starts with country code
    const phoneWithCountryCode = formattedPhone.startsWith('55') 
      ? formattedPhone 
      : `55${formattedPhone}`;
    
    const encodedMessage = encodeURIComponent(messageText);
    return `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`;
  }, []);

  return {
    generateWhatsAppLink
  };
}
