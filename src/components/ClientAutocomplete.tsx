
import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, Loader2, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ClientForm from "@/components/ClientForm";
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';
import { formatPhone } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';

interface ClientAutocompleteProps {
  onClientSelect: (client: Client | null) => void;
  selectedClient?: Client | null;
  autofocus?: boolean;
  placeholder?: string;
}

export function ClientAutocomplete({ 
  onClientSelect, 
  selectedClient = null,
  autofocus = false,
  placeholder = 'Buscar cliente por nome ou telefone...'
}: ClientAutocompleteProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const { toast } = useToast();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inicializar a busca quando o componente montar
    if (!selectedClient) {
      fetchClients();
    }
  }, []);
  
  const fetchClients = async (query: string = '') => {
    setIsLoading(true);
    
    try {
      let queryBuilder = supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      
      if (query) {
        queryBuilder = queryBuilder.or(`nome.ilike.%${query}%,telefone.ilike.%${query}%`);
      }
      
      const { data, error } = await queryBuilder.limit(30);
      
      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }
      
      if (data) {
        const mappedClients: Client[] = data.map(item => ({
          id: item.id,
          name: item.nome,
          phone: item.telefone,
          email: item.email || '',
          notes: item.observacoes || '',
          totalSpent: item.valor_total || 0,
          birthdate: item.data_nascimento || null,
          lastAppointment: item.ultimo_agendamento || null,
          createdAt: item.data_criacao || null
        }));
        setSearchResults(mappedClients);
      }
    } catch (error) {
      console.error('Unexpected error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length === 0) {
      fetchClients();
      setIsOpen(true);
      return;
    }
    
    if (query.length < 2) return;
    
    fetchClients(query);
    setIsOpen(true);
  };

  const handleSelectClient = (client: Client) => {
    onClientSelect(client);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onClientSelect(null);
    setSearchQuery('');
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      inputRef.current && 
      resultsRef.current &&
      !inputRef.current.contains(event.target as Node) && 
      !resultsRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const openNewClientDialog = () => {
    setShowNewClientDialog(true);
    setIsOpen(false);
  };
  
  // Fix the issue here - specify the parameter type in the function
  const handleNewClientSuccess = (newClient: Client | null) => {
    setShowNewClientDialog(false);
    if (newClient) {
      handleSelectClient(newClient);
      toast({
        title: "Cliente cadastrado com sucesso!",
        description: "Cliente adicionado ao sistema."
      });
    }
  };

  const handleCloseDialog = () => {
    setShowNewClientDialog(false);
  };

  // Determinar o texto a ser mostrado no input
  const displayText = selectedClient ? selectedClient.name : searchQuery;

  return (
    <div className="w-full relative">
      <div className="flex items-center border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
        <div className="flex-1">
          <Input
            type="text"
            className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder={placeholder}
            value={displayText}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (!selectedClient) {
                setIsOpen(true);
              }
            }}
            autoFocus={autofocus}
            ref={inputRef}
            onClick={() => {
              // Ao clicar no input, se tiver cliente selecionado, limpa para permitir nova busca
              if (selectedClient) {
                handleClearSelection();
              }
            }}
          />
        </div>
        <div className="flex items-center pr-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {isOpen && (
        <div 
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-md max-h-60 overflow-y-auto"
        >
          {searchResults.length > 0 ? (
            <div className="p-1">
              {searchResults.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-accent/50 rounded cursor-pointer"
                  onClick={() => handleSelectClient(client)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Phone className="mr-1 h-3 w-3" />
                      <span>{formatPhone(client.phone)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              {searchQuery.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                  <Button 
                    variant="outline" 
                    className="w-full text-sm"
                    onClick={openNewClientDialog}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Cadastrar novo cliente
                  </Button>
                </div>
              ) : (
                isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando clientes...</p>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full text-sm"
                    onClick={openNewClientDialog}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Cadastrar novo cliente
                  </Button>
                )
              )}
            </div>
          )}
          
          <div className="p-1 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-normal"
              onClick={openNewClientDialog}
            >
              <Plus className="h-3 w-3 mr-1" />
              Cadastrar novo cliente
            </Button>
          </div>
        </div>
      )}
      
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar novo cliente</DialogTitle>
          </DialogHeader>
          <ClientForm 
            onSuccess={handleNewClientSuccess}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
