
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
      return "";
    }
    
    let messageText = message || "";
    
    // Replace template variables with actual values
    const replaceVariables = (text: string) => {
      return text
        .replace(/{{nome}}/g, client.name)
        .replace(/{{serviço}}/g, appointment?.service?.name || "")
        .replace(/{{data}}/g, appointment ? format(new Date(appointment.date), 'dd/MM/yyyy') : "")
        .replace(/{{horário}}/g, appointment ? format(new Date(appointment.date), 'HH:mm') : "")
        .replace(/{{valor}}/g, appointment ? `R$ ${appointment.price}` : "");
    };

    messageText = replaceVariables(messageText);
    
    if (!messageText && appointment) {
      const appointmentDate = new Date(appointment.date);
      const serviceType = appointment.service?.name || "serviço";
      
      messageText = `Olá ${client.name}, confirmando seu agendamento de ${serviceType} para o dia ${format(appointmentDate, 'dd/MM/yyyy')} às ${format(appointmentDate, 'HH:mm')}.`;
    }
    
    // Format phone number by removing any non-numeric characters
    const formattedPhone = client.phone.replace(/\D/g, '');
    
    const encodedMessage = encodeURIComponent(messageText);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }, []);

  return {
    generateWhatsAppLink
  };
}
