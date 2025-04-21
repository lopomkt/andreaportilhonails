import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatPhone } from "@/lib/formatters";
import { useEffect, useState } from "react";
import { Client, Appointment } from "@/types";
import { useNavigate } from "react-router-dom";
import { Search, Plus, User, Phone, Calendar, AlertTriangle, MessageCircle, BookOpen, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import ClientForm from "@/components/ClientForm";

export default function ClientsPage() {
  const {
    clients,
    appointments,
    generateWhatsAppLink
  } = useData();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);
  const [view, setView] = useState<"all" | "inactive">("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  useEffect(() => {
    let filtered = clients;
    if (searchTerm) {
      filtered = clients.filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.phone.includes(searchTerm));
    }

    if (view === "inactive") {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 40);
      filtered = filtered.filter(client => {
        return !client.lastAppointment || new Date(client.lastAppointment) < cutoffDate;
      });
    }
    setFilteredClients(filtered);
  }, [clients, searchTerm, view]);

  const handleNewClientSuccess = () => {
    setShowNewClientModal(false);
    toast({
      title: "Cliente cadastrado",
      description: "Cliente cadastrado com sucesso!"
    });
  };

  const getClientAppointments = (clientId: string) => {
    return appointments.filter(appointment => appointment.clientId === clientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const generateInactiveMessage = async (client: Client) => {
    if (!client) return "";
    return generateWhatsAppLink({
      client,
      message: `Olá ${client.name}, sentimos sua falta! Já faz um tempo desde seu último atendimento conosco. Que tal agendar um horário? Responda essa mensagem e vamos marcar. 😊`
    });
  };

  return <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 px-[30px]">
          <Button variant={view === "all" ? "default" : "outline"} onClick={() => setView("all")} className={view === "all" ? "bg-nail-500 hover:bg-nail-600" : "hover:border-nail-500 hover:text-nail-500"}>
            Todos
          </Button>
          <Button variant={view === "inactive" ? "default" : "outline"} onClick={() => setView("inactive")} className={view === "inactive" ? "bg-nail-500 hover:bg-nail-600" : "hover:border-nail-500 hover:text-nail-500"}>
            Inativos
          </Button>
          <Button onClick={() => setShowNewClientModal(true)} className="gap-1 bg-nail-500 hover:bg-nail-600 px-[8px] text-sm">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.length > 0 ? filteredClients.map(client => <ClientCard key={client.id} client={client} onViewDetails={() => setSelectedClient(client)} getWhatsAppLink={generateInactiveMessage} />) : <div className="col-span-full text-center py-12">
            <User className="h-12 w-12 mx-auto text-nail-300 mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-1">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente outro termo de busca" : view === "inactive" ? "Não há clientes inativos" : "Adicione um novo cliente para começar"}
            </p>
          </div>}
      </div>

      {selectedClient && <Dialog open={!!selectedClient} onOpenChange={open => !open && setSelectedClient(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Detalhes do Cliente</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="appointments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="appointments">Histórico</TabsTrigger>
                <TabsTrigger value="details">Informações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="appointments" className="py-4">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-nail-500" />
                  Histórico de Agendamentos
                </h3>
                
                <ClientAppointmentsHistory clientId={selectedClient.id} getClientAppointments={getClientAppointments} />
              </TabsContent>
              
              <TabsContent value="details" className="py-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-nail-100 text-nail-700 text-2xl">
                        {selectedClient.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="text-2xl font-medium">{selectedClient.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Cliente desde {format(new Date(selectedClient.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Contato</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-nail-500" />
                          <a href={`tel:${selectedClient.phone}`} className="text-sm hover:underline">
                            {formatPhone(selectedClient.phone)}
                          </a>
                        </div>
                        {selectedClient.email && <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-nail-500" />
                            <a href={`mailto:${selectedClient.email}`} className="text-sm hover:underline">
                              {selectedClient.email}
                            </a>
                          </div>}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Resumo</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total gasto:</span>
                          <span className="font-medium">{formatCurrency(selectedClient.totalSpent)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Último agendamento:</span>
                          <span className="font-medium">
                            {selectedClient.lastAppointment ? format(new Date(selectedClient.lastAppointment), 'dd/MM/yyyy') : "Nunca agendou"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Observações</h4>
                    <Textarea value={selectedClient.notes || ""} placeholder="Adicione observações sobre este cliente..." rows={4} className="w-full" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
              <Button className="gap-2 bg-nail-500 hover:bg-nail-600" onClick={() => navigate("/calendario")}>
                <Calendar className="h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>}

      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar novo cliente</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={handleNewClientSuccess} onCancel={() => setShowNewClientModal(false)} />
        </DialogContent>
      </Dialog>
    </div>;
}

interface ClientCardProps {
  client: Client;
  onViewDetails: () => void;
  getWhatsAppLink: (client: Client) => Promise<string>;
}

function ClientCard({
  client,
  onViewDetails,
  getWhatsAppLink
}: ClientCardProps) {
  const navigate = useNavigate();

  const daysSinceLastAppointment = client.lastAppointment ? differenceInDays(new Date(), new Date(client.lastAppointment)) : null;

  const isInactive = !client.lastAppointment || daysSinceLastAppointment && daysSinceLastAppointment >= 40;
  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = await getWhatsAppLink(client);
    if (link) {
      window.open(link, '_blank');
    }
  };
  return <Card className={isInactive ? "border-2 border-status-pending" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{client.name}</CardTitle>
          {isInactive && <div className="bg-status-pending/10 text-status-pending rounded-full p-1">
              <AlertTriangle className="h-4 w-4" />
            </div>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <a href={`tel:${client.phone}`} className="text-sm">
            {formatPhone(client.phone)}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {client.lastAppointment ? isInactive ? `${daysSinceLastAppointment} dias sem agendamento` : `Último: ${format(new Date(client.lastAppointment), "dd/MM/yyyy")}` : "Sem agendamentos"}
          </span>
        </div>
        {client.notes && <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground truncate">{client.notes}</p>
          </div>}
        <div className="pt-2 flex flex-col gap-2">
          <div className="text-sm font-medium">
            Total gasto: {formatCurrency(client.totalSpent)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
              Detalhes
            </Button>
            {isInactive ? <Button size="sm" className="flex-1 gap-1 bg-green-500 hover:bg-green-600" onClick={handleWhatsAppClick}>
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button> : <Button size="sm" className="flex-1 bg-nail-500 hover:bg-nail-600" onClick={() => navigate("/calendario")}>
                Agendar
              </Button>}
          </div>
        </div>
      </CardContent>
    </Card>;
}

interface ClientAppointmentsHistoryProps {
  clientId: string;
  getClientAppointments: (clientId: string) => Appointment[];
}

function ClientAppointmentsHistory({
  clientId,
  getClientAppointments
}: ClientAppointmentsHistoryProps) {
  const clientAppointments = getClientAppointments(clientId);
  if (clientAppointments.length === 0) {
    return <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-nail-200 mx-auto mb-2" />
        <p className="text-muted-foreground">Este cliente ainda não possui agendamentos</p>
      </div>;
  }
  return <div className="space-y-2">
      {clientAppointments.map(appointment => <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center bg-nail-50 text-nail-700 rounded-md p-2 w-14">
              <span className="text-xs">{format(new Date(appointment.date), 'MMM')}</span>
              <span className="text-lg font-bold">{format(new Date(appointment.date), 'dd')}</span>
              <span className="text-xs">{format(new Date(appointment.date), 'yyyy')}</span>
            </div>
            
            <div>
              <p className="font-medium">{appointment.service?.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(appointment.date), 'HH:mm')}</span>
                <span>({appointment.service?.durationMinutes} min)</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-medium">{formatCurrency(appointment.price)}</p>
            <span className={`status-badge ${appointment.status === "confirmed" ? "status-confirmed" : appointment.status === "pending" ? "status-pending" : "status-canceled"}`}>
              {appointment.status === "confirmed" ? "Confirmado" : appointment.status === "pending" ? "Pendente" : "Cancelado"}
            </span>
          </div>
        </div>)}
    </div>;
}
