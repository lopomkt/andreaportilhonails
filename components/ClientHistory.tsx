
import { useData } from "@/context/DataContext";
import { Client, Appointment } from "@/types";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Calendar, Clock, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientHistoryProps {
  client: Client;
}

export function ClientHistory({ client }: ClientHistoryProps) {
  const { appointments, services } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  
  // Get all appointments for this client
  const clientAppointments = appointments
    .filter(appointment => appointment.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Apply filters
  const filteredAppointments = clientAppointments.filter(appointment => {
    // Apply period filter
    if (periodFilter !== "all") {
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      const daysDiff = differenceInDays(today, appointmentDate);
      
      switch (periodFilter) {
        case "30days":
          if (daysDiff > 30) return false;
          break;
        case "90days":
          if (daysDiff > 90) return false;
          break;
        case "6months":
          if (daysDiff > 180) return false;
          break;
        case "1year":
          if (daysDiff > 365) return false;
          break;
      }
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const service = services.find(s => s.id === appointment.serviceId);
      const searchLower = searchTerm.toLowerCase();
      
      const serviceMatch = service?.name.toLowerCase().includes(searchLower);
      const dateMatch = format(new Date(appointment.date), "dd/MM/yyyy").includes(searchLower);
      const statusMatch = 
        (appointment.status === "confirmed" && "confirmado".includes(searchLower)) ||
        (appointment.status === "pending" && "pendente".includes(searchLower)) ||
        (appointment.status === "canceled" && "cancelado".includes(searchLower));
        
      if (!(serviceMatch || dateMatch || statusMatch)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Calculate total spent based on filtered appointments
  const totalSpent = filteredAppointments
    .filter(a => a.status !== "canceled")
    .reduce((total, a) => total + a.price, 0);
    
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="space-y-2 flex-1">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar por serviço, data ou status..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2 w-full md:w-48">
          <Label htmlFor="period">Período</Label>
          <Select
            value={periodFilter}
            onValueChange={setPeriodFilter}
          >
            <SelectTrigger id="period">
              <SelectValue placeholder="Selecione um período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center justify-between py-2 px-4 bg-primary/10 rounded-md">
        <span className="text-sm font-medium">
          Total gasto no período: 
        </span>
        <span className="font-bold text-primary">
          {formatCurrency(totalSpent)}
        </span>
      </div>
      
      {filteredAppointments.length === 0 ? (
        <div className="text-center p-8 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">
            Nenhum agendamento encontrado para os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentHistoryCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      )}
    </div>
  );
}

interface AppointmentHistoryCardProps {
  appointment: Appointment;
}

function AppointmentHistoryCard({ appointment }: AppointmentHistoryCardProps) {
  const { services } = useData();
  const service = services.find(s => s.id === appointment.serviceId);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(appointment.date), "PPPP", { locale: ptBR })}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(appointment.date), "HH:mm")}
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="font-medium">{service?.name}</h3>
            {appointment.notes && (
              <p className="text-xs text-muted-foreground mt-1">
                {appointment.notes}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            <span className="font-bold text-primary">
              {formatCurrency(appointment.price)}
            </span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                appointment.status === "confirmed" ? "bg-green-100 text-green-800" :
                appointment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              )}
            >
              {appointment.status === "confirmed" ? "Confirmado" :
               appointment.status === "pending" ? "Pendente" : "Cancelado"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
