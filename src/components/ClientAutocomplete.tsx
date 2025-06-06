import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, Loader2, Phone, AlertCircle } from 'lucide-react';
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
  className?: string;
}

export function ClientAutocomplete({ 
  onClientSelect, 
  selectedClient = null,
  autofocus = false,
  placeholder = 'Buscar cliente por nome ou telefone...',
  className
}: ClientAutocompleteProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedClient) {
      setSearchQuery(selectedClient.name);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (autofocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autofocus]);
  
  const fetchClients = async (query: string = '') => {
    setIsLoading(true);
    setFetchError(null);
    
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
        setFetchError(error.message);
        toast({
          title: 'Erro ao buscar clientes',
          description: error.message,
          variant: 'destructive'
        });
        setSearchResults([]);
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
      } else {
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching clients:', error);
      setFetchError(error.message || 'Erro desconhecido ao buscar clientes');
      toast({
        title: 'Erro',
        description: 'Erro ao buscar clientes. Tente novamente.',
        variant: 'destructive'
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (selectedClient) {
      onClientSelect(null);
    }
    
    if (query.length === 0) {
      setIsOpen(false);
      setSearchResults([]);
      return;
    }
    
    if (query.length >= 2) {
      fetchClients(query);
      setIsOpen(true);
    }
  };

  const handleSelectClient = (client: Client) => {
    if (client && client.id) {
      onClientSelect(client);
      setSearchQuery(client.name);
      setIsOpen(false);
    } else {
      toast({
        title: 'Erro',
        description: 'Cliente inválido selecionado',
        variant: 'destructive'
      });
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

  return (
    <div className={cn("w-full relative", className)} id="client-autocomplete">
      <div className="flex items-center border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
        <div className="flex-1">
          <Input
            type="text"
            className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (searchQuery.length >= 2) {
                setIsOpen(true);
              }
            }}
            autoFocus={autofocus}
            ref={inputRef}
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
          {fetchError ? (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center text-destructive mb-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p className="text-sm font-medium">Erro ao buscar clientes</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full text-sm mt-2"
                onClick={() => fetchClients(searchQuery)}
              >
                Tentar novamente
              </Button>
            </div>
          ) : searchResults.length > 0 ? (
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
            onCancel={() => setShowNewClientDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
