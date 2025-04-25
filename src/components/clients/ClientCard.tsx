
import { Client } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatPhone } from '@/lib/formatters';
import { format } from 'date-fns';
import { UserRound, Calendar, MessageCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientCardProps {
  client: Client;
  onViewDetails: () => void;
  onEditClick: () => void;
  onScheduleClick: () => void;
}

export function ClientCard({
  client,
  onViewDetails,
  onEditClick,
  onScheduleClick
}: ClientCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:border-nail-300 transition-colors"
      onClick={onViewDetails}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-nail-500" />
          <h3 className="text-lg font-medium truncate">{client.name}</h3>
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
            <Calendar className="h-4 w-4 mr-1" />
            Agendar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
