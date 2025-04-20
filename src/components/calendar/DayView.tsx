
import React from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CalendarX, Scissors, Star, FileSpreadsheet, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/AppointmentForm";
import { AppointmentFormWrapper } from "@/components/AppointmentFormWrapper";

interface DayViewProps {
  date: Date;
}

export const DayView: React.FC<DayViewProps> = ({
  date
}) => {
  const [selectedAppointment, setSelectedAppointment] = React.useState<any>(null);
  const [showFilters, setShowFilters] = React.useState<boolean>(false);
  const {
    appointments,
    blockedDates
  } = useSupabaseData();
  
  const dayAppointments = appointments.filter(appt => isSameDay(new Date(appt.date), date));
  const dayBlocks = blockedDates.filter(block => isSameDay(new Date(block.date), date));

  // Group appointments by hour
  const appointmentsByHour = dayAppointments.reduce((groups, appointment) => {
    const hour = format(new Date(appointment.date), 'HH:00');
    if (!groups[hour]) {
      groups[hour] = [];
    }
    groups[hour].push(appointment);
    return groups;
  }, {} as Record<string, typeof dayAppointments>);
  
  const hours = Object.keys(appointmentsByHour).sort();
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'canceled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  const getServiceIcon = (serviceName: string) => {
    const name = serviceName?.toLowerCase() || '';
    if (name.includes('manicure') || name.includes('unha')) {
      return <Scissors className="h-4 w-4" />;
    } else if (name.includes('art') || name.includes('decoração')) {
      return <Star className="h-4 w-4" />;
    } else {
      return <FileSpreadsheet className="h-4 w-4" />;
    }
  };
  
  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
  };
  
  return <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center py-0 my-[24px] px-[16px]">
        <h2 className="font-bold text-lg md:text-2xl">
          Agendamentos de {format(date, 'dd/MM/yyyy', {
          locale: ptBR
        })}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          Filtrar
        </Button>
      </div>
      
      {/* Filter section - hidden by default */}
      {showFilters && (
        <div className="bg-accent/10 p-4 rounded-lg mb-4">
          <h3 className="text-sm font-medium mb-2">Filtros</h3>
          {/* Filter options would go here */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs">Todos</Button>
            <Button variant="outline" size="sm" className="text-xs">Confirmados</Button>
            <Button variant="outline" size="sm" className="text-xs">Pendentes</Button>
            <Button variant="outline" size="sm" className="text-xs">Cancelados</Button>
          </div>
        </div>
      )}
      
      {/* Blocked times section */}
      {dayBlocks.length > 0 && <div className="mt-4 mb-6">
          <h3 className="text-md font-semibold mb-2 flex items-center">
            <CalendarX className="h-4 w-4 mr-2 text-orange-500" />
            Bloqueios
          </h3>
          <div className="space-y-2">
            {dayBlocks.map(block => <Card key={block.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {block.dia_todo ? 'Dia inteiro' : format(new Date(block.date), 'HH:mm')}
                      </h4>
                      <p className="text-sm text-muted-foreground">{block.reason || block.motivo || 'Sem motivo especificado'}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>}
      
      {/* Appointments by hour */}
      {hours.length > 0 ? <div className="space-y-6">
          {hours.map(hour => <div key={hour} className="space-y-2">
              <h3 className="text-md font-semibold sticky top-16 bg-background py-1 z-10">
                {hour}
              </h3>
              <div className="space-y-2">
                {appointmentsByHour[hour].map(appt => <Card key={appt.id} className={`border-l-4 ${appt.status === 'confirmed' ? 'border-l-green-500' : appt.status === 'pending' ? 'border-l-yellow-500' : 'border-l-red-500'}`} onClick={() => handleEditAppointment(appt)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="font-medium">{appt.client?.name}</h4>
                          </div>
                          <div className="flex items-center mt-1">
                            {getServiceIcon(appt.service?.name)}
                            <p className="text-sm ml-1">{appt.service?.name}</p>
                          </div>
                          <div className="flex items-center mt-1 space-x-2">
                            <Badge variant={getStatusBadgeVariant(appt.status) as any}>
                              {appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'pending' ? 'Pendente' : 'Cancelado'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-medium">
                            {appt.price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                          </p>
                          <div className="flex space-x-1 mt-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>
            </div>)}
        </div> : <div className="text-center py-8 bg-accent/10 rounded-lg">
          <p className="text-muted-foreground">Nenhum agendamento para este dia.</p>
        </div>}
      
      {/* Edit Appointment Dialog */}
      {selectedAppointment && (
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
            <DialogHeader>
              <DialogTitle className="text-xl text-rose-700 flex items-center">
                <span className="mr-2">💅</span>
                Editar Agendamento
              </DialogTitle>
            </DialogHeader>
            <AppointmentFormWrapper>
              <AppointmentForm 
                appointment={selectedAppointment}
                clientId={selectedAppointment.clientId}
                serviceId={selectedAppointment.serviceId}
                date={new Date(selectedAppointment.date)}
                notes={selectedAppointment.notes}
                price={selectedAppointment.price}
                status={selectedAppointment.status}
                onSuccess={() => setSelectedAppointment(null)}
              />
            </AppointmentFormWrapper>
          </DialogContent>
        </Dialog>
      )}
    </div>;
};
