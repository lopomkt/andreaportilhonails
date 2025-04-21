
import { Client } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Calendar, AlertTriangle, MessageCircle, Pencil } from 'lucide-react';
import { formatPhone } from '@/lib/formatters';
import { format, differenceInDays } from 'date-fns';

interface ClientCardProps {
  client: Client;
  onViewDetails: () => void;
  onEditClick: () => void;
  onScheduleClick: () => void;
  getWhatsAppLink?: (client: Client) => Promise<string>;
}

export function ClientCard({
  client,
  onViewDetails,
  onEditClick,
  onScheduleClick,
  getWhatsAppLink
}: ClientCardProps) {
  const daysSinceLastAppointment = client.lastAppointment 
    ? differenceInDays(new Date(), new Date(client.lastAppointment)) 
    : null;

  const isInactive = !client.lastAppointment || (daysSinceLastAppointment && daysSinceLastAppointment >= 40);
  
  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (getWhatsAppLink) {
      const link = await getWhatsAppLink(client);
      if (link) {
        window.open(link, '_blank');
      }
    }
  };

  return (
    <Card 
      className={isInactive ? "border-2 border-status-pending" : ""}
      onClick={onViewDetails}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium">{client.name}</h3>
          {isInactive && (
            <div className="bg-status-pending/10 text-status-pending rounded-full p-1">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <a href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()} className="text-sm">
            {formatPhone(client.phone)}
          </a>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {client.lastAppointment 
              ? isInactive 
                ? `${daysSinceLastAppointment} dias sem agendamento` 
                : `Último: ${format(new Date(client.lastAppointment), "dd/MM/yyyy")}` 
              : "Sem agendamentos"
            }
          </span>
        </div>
        
        {client.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground line-clamp-2">{client.notes}</p>
          </div>
        )}
        
        <div className="pt-2 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
          
          {isInactive && getWhatsAppLink ? (
            <Button 
              size="sm" 
              className="flex-1 gap-1 bg-green-500 hover:bg-green-600" 
              onClick={handleWhatsAppClick}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          ) : (
            <Button 
              size="sm" 
              className="flex-1 bg-nail-500 hover:bg-nail-600"
              onClick={(e) => {
                e.stopPropagation();
                onScheduleClick();
              }}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Agendar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
