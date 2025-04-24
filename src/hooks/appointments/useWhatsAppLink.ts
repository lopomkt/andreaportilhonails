
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
    
    if (!messageText && appointment) {
      const appointmentDate = new Date(appointment.date);
      const serviceType = appointment.service?.name || "serviço";
      
      messageText = `Olá ${client.name}, confirmando seu agendamento de ${serviceType} para o dia ${format(appointmentDate, 'dd/MM/yyyy')} às ${format(appointmentDate, 'HH:mm')}.`;
    }
    
    const encodedMessage = encodeURIComponent(messageText);
    return `https://wa.me/${client.phone}?text=${encodedMessage}`;
  }, []);

  return {
    generateWhatsAppLink
  };
}
