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
    const fetchLastServices = async () => {
      const servicesMap: Record<string, string> = {};
      
      for (const client of clients) {
        if (client.lastAppointment) {
          try {
            const { data, error } = await supabase
              .from('agendamentos')
              .select('servico_id')
              .eq('cliente_id', client.id)
              .order('data', { ascending: false })
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
      fetchServices();
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

  const handleScheduleClick = (client: Client) => {
    console.log("Scheduling for client:", client);
    setSelectedClient(client);
    setIsScheduling(true);
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
        .from('agendamentos')
        .select(`
          id,
          data,
          preco,
          servico_id
        `)
        .eq('cliente_id', selectedClient.id)
        .order('data', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      const historyWithServices = await Promise.all(
        data.map(async (appointment) => {
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
    
    setIsSubmitting(true);
    
    try {
      const selectedService = services.find(s => s.id === formData.serviceId);
      
      if (!selectedService) {
        throw new Error("Serviço não encontrado");
      }
      
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      const result = await addAppointment({
        clientId: selectedClient.id,
        serviceId: formData.serviceId,
        date: dateTime.toISOString(),
        price: selectedService.price,
        status: 'pending'
      });
      
      if (result && result.success) {
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
        throw new Error(result?.error?.message || "Falha ao criar agendamento");
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
            onScheduleClick={() => handleScheduleClick(client)}
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
                      <p className="font-medium">{format(new Date(appointment.data), "dd/MM/yyyy")}</p>
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

      <Dialog open={isScheduling} onOpenChange={setIsScheduling}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar para {selectedClient?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Serviço</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  id="serviceId"
                  value={formData.serviceId}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione um serviço</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - R$ {service.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded-md"
                  id="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora</label>
                <input 
                  type="time" 
                  className="w-full p-2 border rounded-md"
                  id="time"
                  value={formData.time}
                  onChange={handleInputChange}
                />
              </div>
              <Button 
                className="w-full bg-nail-500 hover:bg-nail-600"
                onClick={handleCreateAppointment}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Agendar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
