import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Service } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatCurrency, formatDuration } from "@/lib/formatters";
import { Clock, Pencil, Trash, Plus } from "lucide-react";
import { ServiceForm } from "./ServiceForm";
import { toast } from "@/hooks/use-toast";
export function ServiceList() {
  const {
    services,
    deleteService
  } = useData();
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const [showAddForm, setShowAddForm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const handleEdit = (service: Service) => {
    setSelectedService(service);
  };
  const handleDelete = async (serviceId: string) => {
    try {
      await deleteService(serviceId);
      setServiceToDelete(null);
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso."
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o serviço.",
        variant: "destructive"
      });
    }
  };
  const sortedServices = [...services].sort((a, b) => a.name.localeCompare(b.name));
  return <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium px-0 mx-[15px]">Lista de Serviços</h2>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Serviço</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo serviço.
              </DialogDescription>
            </DialogHeader>
            <ServiceForm onSuccess={() => setShowAddForm(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      {sortedServices.length === 0 ? <div className="text-center p-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
          
        </div> : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedServices.map(service => <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate">{service.name}</h3>
                    <div className="flex gap-1 shrink-0">
                      <Dialog open={selectedService?.id === service.id} onOpenChange={open => {
                  if (!open) setSelectedService(undefined);
                }}>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(service)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Serviço</DialogTitle>
                            <DialogDescription>
                              Atualize os dados do serviço.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedService && <ServiceForm service={selectedService} onSuccess={() => setSelectedService(undefined)} />}
                        </DialogContent>
                      </Dialog>
                      
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setServiceToDelete(service)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(service.durationMinutes)}</span>
                  </div>
                  
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(service.price)}
                  </div>
                  
                  {service.description && <p className="text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>}
                </div>
              </CardContent>
            </Card>)}
        </div>}
      
      {/* Delete Confirmation */}
      <AlertDialog open={serviceToDelete !== null} onOpenChange={open => !open && setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{serviceToDelete?.name}"?
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => serviceToDelete && handleDelete(serviceToDelete.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}