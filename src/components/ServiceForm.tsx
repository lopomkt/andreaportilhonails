
import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Service } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { formatDuration } from "@/lib/formatters";

interface ServiceFormProps {
  service?: Service;
  onSuccess?: () => void;
}

export function ServiceForm({ service, onSuccess }: ServiceFormProps) {
  const { addService, updateService } = useData();
  
  const [name, setName] = useState(service?.name || "");
  const [price, setPrice] = useState(service?.price.toString() || "");
  const [hours, setHours] = useState(
    service ? Math.floor(service.durationMinutes / 60).toString() : "0"
  );
  const [minutes, setMinutes] = useState(
    service ? (service.durationMinutes % 60).toString() : "30"
  );
  const [description, setDescription] = useState(service?.description || "");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !price.trim() || (!hours.trim() && !minutes.trim())) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    const durationMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    
    if (durationMinutes <= 0) {
      toast({
        title: "Duração inválida",
        description: "A duração do serviço deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const serviceData = {
        name: name.trim(),
        price: parseFloat(price),
        durationMinutes,
        description: description.trim() || undefined
      };
      
      if (service) {
        await updateService(service.id, serviceData);
        toast({
          title: "Serviço atualizado",
          description: "O serviço foi atualizado com sucesso."
        });
      } else {
        await addService(serviceData);
        toast({
          title: "Serviço criado",
          description: "O serviço foi criado com sucesso."
        });
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving service:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o serviço.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Serviço <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Manicure, Pedicure, etc."
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="price">Preço (R$) <span className="text-red-500">*</span></Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Ex: 50.00"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Duração <span className="text-red-500">*</span></Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="hours" className="text-sm">Horas</Label>
            <Input
              id="hours"
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="minutes" className="text-sm">Minutos</Label>
            <Input
              id="minutes"
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
        </div>
        
        {(parseInt(hours) > 0 || parseInt(minutes) > 0) && (
          <p className="text-sm text-muted-foreground mt-1">
            Duração total: {formatDuration((parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0))}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes adicionais sobre o serviço..."
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90"
        >
          {service ? "Atualizar Serviço" : "Adicionar Serviço"}
        </Button>
      </div>
    </form>
  );
}
