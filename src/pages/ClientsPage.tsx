import { useEffect, useState } from "react";
import { Client } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, UserRound, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ClientForm from "@/components/clients/ClientForm";
import { supabase } from '@/integrations/supabase/client';
import { ClientsList } from "@/components/clients/ClientsList";
import { fetchClientsFromApi, createClientInApi } from "@/services/clientApi";
import { addDays } from "date-fns";
import { ClientImportDialog } from "@/components/clients/ClientImportDialog";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const { toast } = useToast();

  const fetchClients = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("ClientsPage: Fetching clients...");
      const fetchedClients = await fetchClientsFromApi();
      console.log("ClientsPage: Clients fetched successfully", fetchedClients);
      setClients(fetchedClients);
      return;
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Ocorreu um erro ao buscar a lista de clientes.",
        variant: "destructive",
      });
      return;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('clientes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clientes'
        },
        (payload) => {
          console.log('ClientsPage: Change received!', payload);
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!clients) {
      setFilteredClients([]);
      return;
    }
    
    let filtered = [...clients];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        client.phone?.includes(searchTerm)
      );
    }
    
    // Filtrar por status (ativo/inativo)
    if (activeTab === 'inactive') {
      filtered = filtered.filter(client => {
        // Cliente tem último agendamento e este foi há mais de 30 dias
        if (client.lastAppointment) {
          const lastApptDate = new Date(client.lastAppointment);
          const thirtyDaysAgo = addDays(new Date(), -30);
          return lastApptDate < thirtyDaysAgo;
        }
        return false; // Não incluir clientes sem agendamento entre os inativos
      });
    } else {
      // Clientes ativos: novos ou com agendamento recente
      filtered = filtered.filter(client => {
        if (!client.lastAppointment) {
          return true; // Cliente novo (sem agendamentos)
        } else {
          const lastApptDate = new Date(client.lastAppointment);
          const thirtyDaysAgo = addDays(new Date(), -30);
          return lastApptDate >= thirtyDaysAgo; // Agendamento recente (menos de 30 dias)
        }
      });
    }
    
    setFilteredClients(filtered);
  }, [clients, searchTerm, activeTab]);

  const handleNewClientSubmit = async (clientData: Partial<Client>) => {
    console.log("Creating new client with data:", clientData);
    try {
      const result = await createClientInApi(clientData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log("Client created successfully:", result.data);
      setShowNewClientModal(false);
      await fetchClients();
      
      toast({
        title: "Cliente cadastrado",
        description: "Cliente cadastrado com sucesso!"
      });
      
      return result;
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: "Erro ao criar cliente",
        description: error.message || "Ocorreu um erro ao cadastrar o cliente.",
        variant: "destructive"
      });
      return { error: error.message };
    }
  };

  const handleNewClientSuccess = async () => {
    console.log("ClientsPage: New client created successfully");
    setShowNewClientModal(false);
    await fetchClients();
    toast({
      title: "Cliente cadastrado",
      description: "Cliente cadastrado com sucesso!"
    });
  };

  const handleImportSuccess = async () => {
    console.log("ClientsPage: Import completed successfully");
    setShowImportModal(false);
    await fetchClients();
    toast({
      title: "Importação concluída",
      description: "Clientes importados com sucesso!"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500"></div>
          <p className="text-sm text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-5xl mx-auto px-4 py-4 pb-20">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar cliente..." 
            className="pl-9" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowImportModal(true)} 
            className="gap-1 bg-secondary hover:bg-secondary/80 whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button 
            onClick={() => setShowNewClientModal(true)} 
            className="gap-1 bg-nail-500 hover:bg-nail-600 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
        <Button 
          variant={activeTab === 'active' ? "default" : "outline"}
          onClick={() => setActiveTab('active')}
          className={`${activeTab === 'active' ? "bg-nail-500 hover:bg-nail-600" : ""} w-[calc(50%-0.25rem)] sm:w-auto`}
        >
          <UserRound className="h-4 w-4 mr-1" />
          Ativos
        </Button>
        <Button 
          variant={activeTab === 'inactive' ? "default" : "outline"}
          onClick={() => setActiveTab('inactive')}
          className={`${activeTab === 'inactive' ? "bg-nail-500 hover:bg-nail-600" : ""} w-[calc(50%-0.25rem)] sm:w-auto`}
        >
          <UserRound className="h-4 w-4 mr-1" />
          Inativos
        </Button>
      </div>

      <Card className="p-4">
        <ClientsList 
          clients={filteredClients} 
          onClientUpdated={fetchClients} 
          activeTab={activeTab}
        />
      </Card>

      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar novo cliente</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para cadastrar um novo cliente.
            </DialogDescription>
          </DialogHeader>
          <ClientForm 
            onSuccess={handleNewClientSuccess} 
            onCancel={() => setShowNewClientModal(false)} 
          />
        </DialogContent>
      </Dialog>

      <ClientImportDialog
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
