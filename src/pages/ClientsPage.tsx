import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatPhone } from "@/lib/formatters";
import { useEffect, useMemo, useState } from "react";
import { Client, Appointment } from "@/types";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Phone, Calendar, AlertTriangle, MessageCircle, Pencil, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import ClientForm from "@/components/ClientForm";
import { format, differenceInDays } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function LoadingSpinner({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500"></div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function EmptyClientsState({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="text-center py-12">
      <Avatar className="h-16 w-16 mx-auto text-rose-300 mb-4 opacity-30">
        <AvatarFallback className="bg-rose-100/50 text-rose-400 text-2xl">?</AvatarFallback>
      </Avatar>
      <h3 className="text-lg font-medium mb-1">Nenhum cliente encontrado</h3>
      <p className="text-muted-foreground">
        {searchTerm
          ? "Tente outro termo de busca"
          : "Adicione um novo cliente para começar"}
      </p>
    </div>
  );
}

function ClientListSection({
  clients,
  onEditClick,
  onScheduleClick,
  onClientClick
}: {
  clients: Client[];
  onEditClick: (client: Client) => void;
  onScheduleClick: (client: Client) => void;
  onClientClick: (client: Client) => void;
}) {
  return (
    <div className="space-y-3 pb-6">
      {clients.map(client => (
        <ClientListItem
          key={client.id}
          client={client}
          onEditClick={() => onEditClick(client)}
          onScheduleClick={() => onScheduleClick(client)}
          onClick={() => onClientClick(client)}
        />
      ))}
    </div>
  );
}

function ClientListItem({ client, onEditClick, onScheduleClick, onClick }: {
  client: Client;
  onEditClick: () => void;
  onScheduleClick: () => void;
  onClick: () => void;
}) {
  const daysSinceLastAppointment = client.lastAppointment
    ? differenceInDays(new Date(), new Date(client.lastAppointment))
    : null;
  const isInactive = !client.lastAppointment || (daysSinceLastAppointment && daysSinceLastAppointment >= 40);
  return (
    <div
      className={`p-4 border rounded-lg hover:shadow-sm transition-all cursor-pointer ${
        isInactive ? "border-l-4 border-l-status-pending" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{client.name}</h3>
            {isInactive && (
              <span className="inline-flex items-center bg-status-pending/10 text-status-pending rounded-full p-1">
                <AlertTriangle className="h-4 w-4" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()} className="text-sm">
              {formatPhone(client.phone)}
            </a>
          </div>
          <div className="text-sm text-muted-foreground">
            {client.lastAppointment ? (
              <span>Último agendamento: {format(new Date(client.lastAppointment), "dd/MM/yyyy")}</span>
            ) : (
              <span>Sem agendamentos</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0 justify-end">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
          >
            <Pencil className="h-4 w-4" />
            <span className="md:hidden">Editar</span>
          </Button>
          <Button
            size="sm"
            className="gap-1 bg-nail-500 hover:bg-nail-600"
            onClick={(e) => {
              e.stopPropagation();
              onScheduleClick();
            }}
          >
            <Calendar className="h-4 w-4" />
            Agendar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ClientDetailDialog({
  open,
  onOpenChange,
  client,
  onEditClick,
  onScheduleClick
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onEditClick: () => void;
  onScheduleClick: () => void;
}) {
  if (!client) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <ClientAppointmentsHistory clientId={client.id} />
          </TabsContent>
          <TabsContent value="details" className="py-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-nail-100 text-nail-700 text-2xl">
                    {client.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-medium">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Cliente desde {client.createdAt ? format(new Date(client.createdAt), 'dd/MM/yyyy') : 'data desconhecida'}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-1">Contato</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-nail-500" />
                      <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                        {formatPhone(client.phone)}
                      </a>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-nail-500" />
                        <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                          {client.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Resumo</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total gasto:</span>
                      <span className="font-medium">{formatCurrency(client.totalSpent)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Último agendamento:</span>
                      <span className="font-medium">
                        {client.lastAppointment ? format(new Date(client.lastAppointment), 'dd/MM/yyyy') : "Nunca agendou"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Observações</h4>
                <Textarea defaultValue={client.notes || ""} readOnly placeholder="Sem observações" rows={4} className="w-full" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
          <Button
            className="gap-2 bg-nail-500 hover:bg-nail-600"
            onClick={onScheduleClick}
          >
            <Calendar className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClientAppointmentsHistory({ clientId }: { clientId: string }) {
  const { appointments } = useData();
  const getClientAppointments = (clientId: string) =>
    (appointments || []).filter(appointment => appointment.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const clientAppointments = getClientAppointments(clientId);
  if (clientAppointments.length === 0) {
    return <div className="text-center py-8">
      <Calendar className="h-12 w-12 text-nail-200 mx-auto mb-2" />
      <p className="text-muted-foreground">Este cliente ainda não possui agendamentos</p>
    </div>;
  }
  return <div className="space-y-2">
    {clientAppointments.map(appointment => (
      <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
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
      </div>
    ))}
  </div>;
}

function NewClientDialog({ open, onOpenChange, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar novo cliente</DialogTitle>
        </DialogHeader>
        <ClientForm onSuccess={onSuccess} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditClientDialog({ open, onOpenChange, client, onSuccess, onDelete }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSuccess: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        {client && (
          <ClientForm
            client={client}
            onSuccess={onSuccess}
            onCancel={() => onOpenChange(false)}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ClientsPage() {
  const {
    clients,
    refetchClients,
    deleteClient
  } = useData();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [view, setView] = useState<"all" | "inactive">("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await refetchClients();
        console.log("Clients loaded:", clients);
      } catch (error) {
        toast({
          title: "Erro ao carregar clientes",
          description: "Ocorreu um erro ao buscar a lista de clientes.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [refetchClients]);

  useEffect(() => {
    if (!clients || !Array.isArray(clients)) {
      setFilteredClients([]);
      return;
    }
    let filtered = [...clients];
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      );
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

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditClientModal(true);
  };

  const handleEditSuccess = async () => {
    setShowEditClientModal(false);
    await refetchClients();
    toast({ title: "Cliente atualizado", description: "Cliente atualizado com sucesso!" });
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    try {
      await deleteClient(selectedClient.id);
      toast({ title: "Cliente excluído", description: "Cliente excluído com sucesso!" });
      setShowDeleteAlert(false);
      setShowEditClientModal(false);
      setSelectedClient(null);
      await refetchClients();
    } catch {
      toast({ title: "Erro", description: "Não foi possível excluir o cliente", variant: "destructive" });
    }
  };

  const handleScheduleForClient = (client: Client) => {
    navigate("/calendario", { state: { selectedClient: client } });
  };

  if (isLoading) return <LoadingSpinner message="Carregando clientes..." />;
  if (!clients) return <LoadingSpinner message="Aguardando dados..." />;
  if (!Array.isArray(clients)) return <EmptyClientsState searchTerm={searchTerm} />;
  if (clients.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in max-w-3xl mx-auto px-4 py-4 pb-20">
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setShowNewClientModal(true)}
            className="gap-1 bg-nail-500 hover:bg-nail-600"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
        <EmptyClientsState searchTerm={searchTerm} />
        <NewClientDialog open={showNewClientModal} onOpenChange={setShowNewClientModal} onSuccess={async () => {
          setShowNewClientModal(false);
          await refetchClients();
          toast({ title: "Cliente cadastrado", description: "Cliente cadastrado com sucesso!" });
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl mx-auto px-4 py-4 pb-20">
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 justify-center">
          <Button
            variant={view === "all" ? "default" : "outline"}
            onClick={() => setView("all")}
            className={view === "all" ? "bg-nail-500 hover:bg-nail-600" : "hover:border-nail-500 hover:text-nail-500"}
          >
            Todos
          </Button>
          <Button
            variant={view === "inactive" ? "default" : "outline"}
            onClick={() => setView("inactive")}
            className={view === "inactive" ? "bg-nail-500 hover:bg-nail-600" : "hover:border-nail-500 hover:text-nail-500"}
          >
            Inativos
          </Button>
          <Button
            onClick={() => setShowNewClientModal(true)}
            className="gap-1 bg-nail-500 hover:bg-nail-600"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {filteredClients.length === 0
        ? <EmptyClientsState searchTerm={searchTerm} />
        : (
          <ClientListSection
            clients={filteredClients}
            onEditClick={handleEditClient}
            onScheduleClick={handleScheduleForClient}
            onClientClick={setSelectedClient}
          />
        )
      }

      <ClientDetailDialog
        open={!!selectedClient && !showEditClientModal}
        onOpenChange={(open) => { if (!open) setSelectedClient(null); }}
        client={selectedClient}
        onScheduleClick={() => selectedClient && handleScheduleForClient(selectedClient)}
        onEditClick={() => selectedClient && handleEditClient(selectedClient)}
      />

      <NewClientDialog open={showNewClientModal} onOpenChange={setShowNewClientModal} onSuccess={async () => {
        setShowNewClientModal(false);
        await refetchClients();
        toast({ title: "Cliente cadastrado", description: "Cliente cadastrado com sucesso!" });
      }} />

      <EditClientDialog
        open={showEditClientModal}
        onOpenChange={setShowEditClientModal}
        client={selectedClient}
        onSuccess={handleEditSuccess}
        onDelete={() => setShowDeleteAlert(true)}
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteClient}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
