
import { useData } from "@/context/DataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Client } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ClientForm from "@/components/ClientForm";
import { ClientsTable } from "@/components/clients/ClientsTable";

export default function ClientsPage() {
  const {
    clients,
    refetchClients,
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await refetchClients();
      } catch (error) {
        console.error("Error fetching clients:", error);
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
  }, [refetchClients, toast]);

  useEffect(() => {
    if (!clients) {
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
    
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const handleNewClientSuccess = async () => {
    setShowNewClientModal(false);
    await refetchClients();
    toast({
      title: "Cliente cadastrado",
      description: "Cliente cadastrado com sucesso!"
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
        <Button 
          onClick={() => setShowNewClientModal(true)} 
          className="gap-1 bg-nail-500 hover:bg-nail-600 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card className="p-4">
        <ClientsTable clients={filteredClients} />
      </Card>

      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar novo cliente</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={handleNewClientSuccess} onCancel={() => setShowNewClientModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
