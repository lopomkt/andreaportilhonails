
import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Service } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatCurrency, formatDuration } from "@/lib/formatters";
import { Clock, Pencil, Trash } from "lucide-react";
import { ServiceForm } from "./ServiceForm";
import { useToast } from "@/hooks/use-toast";
import { useServices } from "@/hooks/useServices";
import { Animation } from "@/components/ui/animation";

interface ServiceListProps {
  refreshTrigger?: number;
}

export function ServiceList({ refreshTrigger = 0 }: ServiceListProps) {
  const { toast } = useToast();
  const { services, fetchServices, deleteService, loading } = useServices();
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Buscar serviços quando o componente montar ou refreshTrigger mudar
  useEffect(() => {
    const loadServices = async () => {
      console.log('ServiceList: Carregando serviços...');
      setIsRefreshing(true);
      try {
        await fetchServices();
        console.log('ServiceList: Serviços carregados com sucesso:', services.length);
      } catch (error) {
        console.error('ServiceList: Erro ao carregar serviços:', error);
        toast({
          title: "Erro ao carregar serviços",
          description: "Não foi possível carregar a lista de serviços.",
          variant: "destructive"
        });
      } finally {
        setIsRefreshing(false);
      }
    };
    
    loadServices();
  }, [fetchServices, refreshTrigger, toast]);

  const handleEdit = (service: Service) => {
    setSelectedService(service);
  };

  const handleDelete = async (serviceId: string) => {
    try {
      setIsDeleting(true);
      console.log('ServiceList: Excluindo serviço:', serviceId);
      const response = await deleteService(serviceId);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setServiceToDelete(null);
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso."
      });
      
    } catch (error: any) {
      console.error("Erro ao excluir serviço:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Ocorreu um erro ao excluir o serviço.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setSelectedService(undefined);
    // Atualizar lista de serviços
    fetchServices();
  };

  // Ordenar serviços por nome
  const sortedServices = [...services].sort((a, b) => a.name.localeCompare(b.name));

  if (loading || isRefreshing) {
    return (
      <div className="flex justify-center p-8">
        <Animation className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium px-0 mx-[15px]">Lista de Serviços</h2>
      </div>
      
      {sortedServices.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedServices.map(service => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate">{service.name}</h3>
                    <div className="flex gap-1 shrink-0">
                      <Dialog open={selectedService?.id === service.id} onOpenChange={open => {
                        if (!open) setSelectedService(undefined);
                      }}>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(service)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Serviço</DialogTitle>
                            <DialogDescription>
                              Atualize os dados do serviço.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedService && (
                            <ServiceForm 
                              service={selectedService} 
                              onSuccess={handleEditSuccess}
                              onCancel={() => setSelectedService(undefined)} 
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive" 
                        onClick={() => setServiceToDelete(service)}
                        disabled={isDeleting}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(service.durationMinutes)}</span>
                  </div>
                  
                  <div className="font-medium text-lg">{formatCurrency(service.price)}</div>
                  
                  {service.description && <p className="text-xs text-muted-foreground mt-2">{service.description}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <AlertDialog open={!!serviceToDelete} onOpenChange={open => !open && setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{serviceToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90" 
              onClick={() => serviceToDelete?.id && handleDelete(serviceToDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting ? <Animation className="h-4 w-4 mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
