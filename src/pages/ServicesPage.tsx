
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { ServiceList } from "@/components/ServiceList";
import { ServiceForm } from "@/components/ServiceForm";
import { Plus, RefreshCw } from "lucide-react";
import { Animation } from "@/components/ui/animation"; 
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataProvider";

export default function ServicesPage() {
  const [showAddService, setShowAddService] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { fetchServices, loading: dataLoading } = useData();
  
  // Buscar serviços quando a página carregar ou quando refreshTrigger mudar
  useEffect(() => {
    const loadServices = async () => {
      console.log('ServicesPage: Carregando serviços...');
      setIsLoading(true);
      try {
        await fetchServices();
        console.log('ServicesPage: Serviços carregados com sucesso');
      } catch (error) {
        console.error('ServicesPage: Erro ao carregar serviços:', error);
        toast({
          title: "Erro ao carregar serviços",
          description: "Não foi possível carregar os serviços. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadServices();
  }, [fetchServices, refreshTrigger, toast]);

  const handleAddService = () => {
    setIsLoading(true);
    setShowAddService(true);
    // Simulate loading to provide feedback
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleServiceSuccess = () => {
    setShowAddService(false);
    // Trigger a refresh of the service list
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Serviço cadastrado",
      description: "O serviço foi cadastrado com sucesso!"
    });
  };
  
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchServices();
      toast({
        title: "Lista atualizada",
        description: "Os serviços foram atualizados com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a lista de serviços.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="tracking-tight text-lg font-bold">Cadastre Serviços</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="gap-2"
            disabled={isLoading || dataLoading}
          >
            {isLoading ? <Animation className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </Button>
          <Button 
            onClick={handleAddService} 
            className="bg-nail-500 hover:bg-nail-600 gap-2 w-full sm:w-auto"
            disabled={isLoading || dataLoading}
          >
            {isLoading ? <Animation className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Novo Serviço
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6">
        {isLoading || dataLoading ? (
          <div className="flex justify-center p-8">
            <Animation className="h-8 w-8" />
          </div>
        ) : (
          <ServiceList refreshTrigger={refreshTrigger} />
        )}
      </div>
      
      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
          </DialogHeader>
          <ServiceForm onSuccess={handleServiceSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
