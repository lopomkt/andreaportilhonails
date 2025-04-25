
import { Client } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { UserRound, Calendar, Pencil, Calendar as CalendarIcon, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientCardProps {
  client: Client;
  onViewDetails: () => void;
  onEditClick: () => void;
  onScheduleClick: () => void;
  lastServiceName?: string;
}

export function ClientCard({
  client,
  onViewDetails,
  onEditClick,
  onScheduleClick,
  lastServiceName
}: ClientCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:border-nail-300 transition-colors border-nail-500/30"
      onClick={onViewDetails}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-nail-500" />
            <h3 className="text-lg font-medium truncate">{client.name}</h3>
          </div>
          <div className="flex items-center gap-2 ml-7">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{client.phone}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {client.lastAppointment 
              ? `Último: ${format(new Date(client.lastAppointment), "dd/MM/yyyy")}` 
              : "Nenhum"
            }
          </span>
        </div>
        
        {lastServiceName && client.lastAppointment && (
          <div className="flex items-center gap-2 ml-6">
            <span className="text-xs text-muted-foreground">
              Serviço: {lastServiceName}
            </span>
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
          
          <Button 
            size="sm" 
            className="flex-1 bg-nail-500 hover:bg-nail-600"
            onClick={(e) => {
              e.stopPropagation();
              onScheduleClick();
            }}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Agendar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
