
import { Client, Appointment, Service } from '@/types';
import { ClientCard } from './ClientCard';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ClientForm from './ClientForm';
import { TrashIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useClients } from "@/context/ClientContext";
import { useServices } from "@/context/ServiceContext";
import { useAppointments } from "@/context/AppointmentContext";

interface ClientsListProps {
  clients: Client[];
  onClientUpdated: () => Promise<void>;
  activeTab: 'active' | 'inactive';
}

export function ClientsList({ clients, onClientUpdated, activeTab }: ClientsListProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastServices, setLastServices] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { addAppointment, refetchAppointments } = useAppointments();
  const { fetchServices, services } = useServices();
  const [isScheduling, setIsScheduling] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: "",
    date: "",
    time: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      console.log("ClientsList: Carregando serviços iniciais");
      try {
        await fetchServices();
        console.log("ClientsList: Serviços carregados:", services.length);
      } catch (error) {
        console.error("ClientsList: Erro ao carregar serviços:", error);
      }
    };
    
    loadServices();
  }, [fetchServices]);

  useEffect(() => {
    const fetchLastServices = async () => {
      const servicesMap: Record<string, string> = {};
      
      for (const client of clients) {
        if (client.lastAppointment) {
          try {
            const { data, error } = await supabase
              .from('agendamentos_novo')
              .select('servico_id')
              .eq('cliente_id', client.id)
              .order('data_inicio', { ascending: false })
              .limit(1)
              .single();
            
            if (data && !error) {
              const { data: serviceData } = await supabase
                .from('servicos')
                .select('nome')
                .eq('id', data.servico_id)
                .single();
                
              if (serviceData) {
                servicesMap[client.id] = serviceData.nome;
              }
            }
          } catch (err) {
            console.error('Erro ao buscar último serviço', err);
          }
        }
      }
      
      setLastServices(servicesMap);
    };
    
    fetchLastServices();
  }, [clients]);

  useEffect(() => {
    if (isScheduling) {
      const loadServicesForScheduling = async () => {
        console.log("ClientsList: Carregando serviços para agendamento");
        try {
          await fetchServices();
          console.log("ClientsList: Serviços carregados para agendamento:", services.length);
          setFormData({
            serviceId: "",
            date: "",
            time: ""
          });
        } catch (error) {
          console.error("ClientsList: Erro ao carregar serviços para agendamento:", error);
        }
      };
      
      loadServicesForScheduling();
    }
  }, [isScheduling, fetchServices]);

  const handleViewDetails = (client: Client) => {
    console.log("Viewing details for client:", client);
    setSelectedClient(client);
    setIsViewingDetails(true);
  };

  const handleEditClick = (client: Client) => {
    console.log("Editing client:", client);
    setSelectedClient(client);
    setIsEditing(true);
    setIsViewingDetails(false);
  };

  const handleSuccess = async () => {
    console.log("Client saved successfully");
    await onClientUpdated();
    setIsEditing(false);
    setIsViewingDetails(false);
    toast({
      title: "Sucesso",
      description: "Cliente salvo com sucesso!"
    });
  };

  const handleViewHistory = async () => {
    if (!selectedClient) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos_novo')
        .select(`
          id,
          data_inicio,
          preco,
          servico_id
        `)
        .eq('cliente_id', selectedClient.id)
        .order('data_inicio', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      const historyWithServices = await Promise.all(
        (data || []).map(async (appointment) => {
          const { data: serviceData } = await supabase
            .from('servicos')
            .select('nome')
            .eq('id', appointment.servico_id)
            .single();
            
          return {
            ...appointment,
            serviceName: serviceData?.nome || 'Serviço não encontrado'
          };
        })
      );
      
      setClientHistory(historyWithServices);
      setIsViewingHistory(true);
    } catch (error) {
      console.error("Error fetching client history:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar o histórico do cliente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', selectedClient.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!"
      });
      
      setIsViewingDetails(false);
      setIsEditing(false);
      await onClientUpdated();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o cliente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedClient || !formData.serviceId || !formData.date || !formData.time) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive"
      });
      return;
    }
    
    const timeHour = parseInt(formData.time.split(":")[0], 10);
    if (timeHour < 7 || timeHour >= 19) {
      toast({
        title: "Horário inválido",
        description: "O horário de atendimento é das 7:00 às 19:00",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const selectedService = services.find(s => s.id === formData.serviceId);
      
      if (!selectedService) {
        throw new Error("Serviço não encontrado");
      }
      
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(dateTime);
      endDateTime.setMinutes(dateTime.getMinutes() + selectedService.durationMinutes);
      
      const endHour = endDateTime.getHours();
      const endMinute = endDateTime.getMinutes();
      if (endHour > 19 || (endHour === 19 && endMinute > 0)) {
        throw new Error("O agendamento ultrapassa o horário de funcionamento que é até às 19:00");
      }
      
      const appointmentData = {
        clientId: selectedClient.id,
        serviceId: formData.serviceId,
        date: dateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        price: selectedService.price,
        status: 'pending' as const
      };
      
      console.log("Criando agendamento:", appointmentData);
      
      const result = await addAppointment(appointmentData);
      
      if (result) {
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso!"
        });
        setIsScheduling(false);
        refetchAppointments();
        setFormData({
          serviceId: "",
          date: "",
          time: ""
        });
      } else {
        throw new Error("Falha ao criar agendamento");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar o agendamento.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  useEffect(() => {
    console.log("ClientsList: Serviços disponíveis:", services.length);
  }, [services]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.length === 0 ? (
        <div className="col-span-full text-center py-10">
          <p className="text-muted-foreground">
            {activeTab === 'active' 
              ? "Nenhum cliente ativo encontrado."
              : "Nenhum cliente inativo encontrado."
            }
          </p>
        </div>
      ) : (
        clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onViewDetails={() => handleViewDetails(client)}
            onEditClick={() => handleEditClick(client)}
            lastServiceName={lastServices[client.id]}
          />
        ))
      )}

      <Dialog open={isViewingDetails} onOpenChange={setIsViewingDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedClient?.name}</DialogTitle>
            <DialogDescription>Detalhes do cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Telefone</p>
              <p>{selectedClient?.phone}</p>
            </div>
            {selectedClient?.email && (
              <div>
                <p className="text-sm font-medium">Email</p>
                <p>{selectedClient?.email}</p>
              </div>
            )}
            {selectedClient?.birthdate && (
              <div>
                <p className="text-sm font-medium">Data de nascimento</p>
                <p>{new Date(selectedClient.birthdate).toLocaleDateString()}</p>
              </div>
            )}
            {selectedClient?.notes && (
              <div>
                <p className="text-sm font-medium">Observações</p>
                <p className="whitespace-pre-wrap">{selectedClient.notes}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleViewHistory}
                disabled={isLoading}
              >
                Histórico
              </Button>
              <Button
                className="px-4 py-2 border rounded bg-nail-500 hover:bg-nail-600 text-white"
                onClick={() => {
                  setIsViewingDetails(false);
                  if (selectedClient) handleEditClick(selectedClient);
                }}
              >
                Editar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedClient ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <>
              <ClientForm
                client={selectedClient}
                onSuccess={handleSuccess}
                onCancel={() => setIsEditing(false)}
              />
              <DialogFooter>
                <Button 
                  variant="destructive" 
                  className="mt-2" 
                  onClick={handleDeleteClient}
                  disabled={isLoading}
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Excluir cliente
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewingHistory} onOpenChange={setIsViewingHistory}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de {selectedClient?.name}</DialogTitle>
            <DialogDescription>Agendamentos anteriores</DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500"></div>
            </div>
          ) : clientHistory.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum agendamento encontrado para este cliente.
            </p>
          ) : (
            <div className="space-y-4 mt-2">
              {clientHistory.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="p-3 border rounded-md hover:bg-muted/40 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{format(new Date(appointment.data_inicio), "dd/MM/yyyy")}</p>
                      <p className="text-sm text-muted-foreground">{appointment.serviceName}</p>
                    </div>
                    <p className="font-medium">R$ {appointment.preco.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
