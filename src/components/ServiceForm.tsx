
import { useState } from "react";
import { useServices } from "@/hooks/useServices";
import { Service } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDuration } from "@/lib/formatters";
import { Animation } from "@/components/ui/animation";

interface ServiceFormProps {
  service?: Service;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServiceForm({ service, onSuccess, onCancel }: ServiceFormProps) {
  const { addService, updateService } = useServices();
  const { toast } = useToast();
  
  const [name, setName] = useState(service?.name || "");
  const [price, setPrice] = useState(service?.price.toString() || "");
  const [hours, setHours] = useState(
    service ? Math.floor(service.durationMinutes / 60).toString() : "0"
  );
  const [minutes, setMinutes] = useState(
    service ? (service.durationMinutes % 60).toString() : "30"
  );
  const [description, setDescription] = useState(service?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }
    
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      newErrors.price = "Preço válido é obrigatório";
    }
    
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    
    if (hoursNum === 0 && minutesNum === 0) {
      newErrors.duration = "Duração deve ser maior que zero";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Formulário inválido",
        description: "Por favor, corrija os erros no formulário.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    console.log("ServiceForm: Iniciando submissão do formulário");
    
    try {
      const durationMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
      
      const serviceData = {
        name: name.trim(),
        price: parseFloat(price),
        durationMinutes,
        description: description.trim() || undefined
      };
      
      console.log("ServiceForm: Dados do serviço:", serviceData);
      
      let result;
      if (service) {
        result = await updateService(service.id, serviceData);
      } else {
        result = await addService(serviceData);
      }
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log("ServiceForm: Serviço salvo com sucesso:", result.data);
      
      toast({
        title: service ? "Serviço atualizado" : "Serviço adicionado",
        description: service 
          ? "O serviço foi atualizado com sucesso!" 
          : "O serviço foi adicionado com sucesso!",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("ServiceForm: Erro ao salvar serviço:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar o serviço.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>
          Nome do Serviço <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Manicure, Pedicure, etc."
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="price" className={errors.price ? "text-destructive" : ""}>
          Preço (R$) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Ex: 50.00"
          className={errors.price ? "border-destructive" : ""}
        />
        {errors.price && (
          <p className="text-sm text-destructive">{errors.price}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label className={errors.duration ? "text-destructive" : ""}>
          Duração <span className="text-red-500">*</span>
        </Label>
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
              className={errors.duration ? "border-destructive" : ""}
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
              className={errors.duration ? "border-destructive" : ""}
            />
          </div>
        </div>
        
        {(parseInt(hours) > 0 || parseInt(minutes) > 0) && (
          <p className="text-sm text-muted-foreground mt-1">
            Duração total: {formatDuration((parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0))}
          </p>
        )}
        
        {errors.duration && (
          <p className="text-sm text-destructive">{errors.duration}</p>
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
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-nail-500 hover:bg-nail-600"
          disabled={isSubmitting}
        >
          {isSubmitting && <Animation className="h-4 w-4 mr-2" />}
          {service ? "Atualizar Serviço" : "Adicionar Serviço"}
        </Button>
      </div>
    </form>
  );
}
