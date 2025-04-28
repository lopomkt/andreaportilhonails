
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Client } from "@/types";
import { Loader } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClientImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ClientImportDialog({ open, onOpenChange, onSuccess }: ClientImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    // Check if file is a CSV
    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Por favor, selecione um arquivo .csv');
      setSelectedFile(null);
      return;
    }
    
    setErrorMessage(null);
    setSelectedFile(file);
  };

  const processCSV = async (text: string): Promise<Partial<Client>[]> => {
    const lines = text.split('\n');
    const clients: Partial<Client>[] = [];
    const headers = ['name', 'phone', 'email', 'birthdate', 'notes'];
    
    // Skip header line if it exists and looks like headers
    const startIndex = lines[0].toLowerCase().includes('nome') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      
      // Skip if we don't have at least name and phone
      if (!values[0] || !values[1]) continue;
      
      const client: Partial<Client> = {};
      
      // Map values to client object properties
      headers.forEach((header, index) => {
        if (values[index]) {
          // Clean up the value
          const value = values[index].trim();
          
          if (header === 'birthdate' && value) {
            // Convert DD/MM/YYYY to ISO format
            const parts = value.split('/');
            if (parts.length === 3) {
              try {
                const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (!isNaN(date.getTime())) {
                  client[header] = date.toISOString();
                }
              } catch (e) {
                console.error("Error parsing date:", value);
              }
            }
          } else {
            client[header] = value;
          }
        }
      });
      
      // Validate required fields
      if (client.name && client.phone) {
        clients.push(client);
      }
    }
    
    return clients;
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setErrorMessage('Por favor, selecione um arquivo .csv');
      return;
    }
    
    setIsImporting(true);
    setErrorMessage(null);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const clients = await processCSV(text);
          
          if (clients.length === 0) {
            throw new Error('Nenhum cliente válido encontrado no arquivo');
          }
          
          console.log(`Importing ${clients.length} clients`, clients);
          
          // Insert clients into Supabase - fix by mapping birthdates to strings
          const dbClients = clients.map(client => ({
            nome: client.name,
            telefone: client.phone,
            email: client.email || null,
            data_nascimento: client.birthdate ? client.birthdate.toString() : null,
            observacoes: client.notes || null,
            data_criacao: new Date().toISOString()
          }));
          
          const { data, error } = await supabase
            .from('clientes')
            .insert(dbClients);
          
          if (error) {
            throw new Error(`Erro ao importar clientes: ${error.message}`);
          }
          
          toast({
            title: "Importação concluída",
            description: `${clients.length} clientes importados com sucesso!`
          });
          
          onSuccess();
        } catch (error: any) {
          console.error("Error importing clients:", error);
          setErrorMessage(error.message || "Erro ao processar o arquivo");
          toast({
            title: "Erro",
            description: error.message || "Erro ao importar clientes",
            variant: "destructive"
          });
        } finally {
          setIsImporting(false);
        }
      };
      
      reader.onerror = () => {
        setErrorMessage("Erro ao ler o arquivo");
        setIsImporting(false);
      };
      
      reader.readAsText(selectedFile);
    } catch (error: any) {
      console.error("Error reading file:", error);
      setErrorMessage(error.message || "Erro ao processar o arquivo");
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Importe seus clientes a partir de um arquivo CSV.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              O arquivo deve conter os seguintes campos, separados por vírgula, na ordem abaixo:
            </p>
            <pre className="bg-secondary/30 p-3 rounded text-xs overflow-x-auto">
              nome,telefone,email,data_nascimento,observacoes
            </pre>
            <p className="text-sm text-muted-foreground">
              A data deve estar no formato DD/MM/YYYY.
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="csv-file" className="block text-sm font-medium">
              Selecione o arquivo CSV:
            </label>
            <input
              type="file"
              id="csv-file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-secondary file:text-secondary-foreground
                hover:file:bg-secondary/80
                cursor-pointer"
            />
          </div>
          
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!selectedFile || isImporting}
            className="bg-nail-500 hover:bg-nail-600"
          >
            {isImporting ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Importando...
              </>
            ) : (
              'Importar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
