
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { ServiceList } from "@/components/ServiceList";
import { ServiceForm } from "@/components/ServiceForm";
import { Plus } from "lucide-react";
import { Animation } from "@/components/ui/animation"; 
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useServices } from "@/hooks/useServices";

export default function ServicesPage() {
  const [showAddService, setShowAddService] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { fetchServices, loading } = useServices();
  
  // Buscar serviços quando a página carregar ou quando refreshTrigger mudar
  useEffect(() => {
    const loadServices = async () => {
      console.log('ServicesPage: Carregando serviços...');
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
  
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="tracking-tight text-lg font-bold">Cadastre Serviços</h1>
        <Button 
          onClick={handleAddService} 
          className="bg-nail-500 hover:bg-nail-600 gap-2 w-full sm:w-auto"
          disabled={isLoading || loading}
        >
          {isLoading ? <Animation className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Novo Serviço
        </Button>
      </div>
      
      <div className="grid gap-6">
        {loading ? (
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
