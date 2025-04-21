
import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ClientForm from "@/components/ClientForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, UserPlus } from "lucide-react";
import { verifySupabaseConnection } from "@/utils/supabaseConnectionCheck";

interface Client {
  id: string;
  nome: string;
  telefone: string;
}

interface ClientAutocompleteProps {
  onClientSelect: (client: { id: string; name: string }) => void;
  selectedClient?: { id: string; name: string } | null;
  initialQuery?: string;
}

export function ClientAutocomplete({ onClientSelect, selectedClient, initialQuery = '' }: ClientAutocompleteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load client data when component mounts
  useEffect(() => {
    // If there's a selected client, set the query to the client name
    if (selectedClient) {
      setQuery(selectedClient.name);
    } else if (initialQuery) {
      setQuery(initialQuery);
      searchClients(initialQuery);
    }
  }, [selectedClient, initialQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search for clients
  const searchClients = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setClients([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    
    try {
      // Verify Supabase connection
      const isConnected = await verifySupabaseConnection();
      if (!isConnected) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, telefone')
        .or(`nome.ilike.%${searchQuery}%,telefone.ilike.%${searchQuery}%`)
        .order('nome', { ascending: true })
        .limit(10);
      
      if (error) {
        console.error("Error searching for clients:", error);
        toast({
          title: "Erro na busca",
          description: "Não foi possível buscar clientes. Tente novamente.",
          variant: "destructive",
        });
        setClients([]);
      } else {
        setClients(data || []);
        setIsOpen(data && data.length > 0);
      }
    } catch (err) {
      console.error("Unexpected error searching for clients:", err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchClients(value);
  };

  // Handle client selection
  const handleSelectClient = (client: Client) => {
    onClientSelect({ id: client.id, name: client.nome });
    setQuery(client.nome);
    setIsOpen(false);
  };

  // Handle new client creation
  const handleNewClient = () => {
    setIsOpen(false);
    setShowNewClientDialog(true);
  };

  // Handle client form success
  const handleClientFormSuccess = (clientId: string, clientName: string) => {
    onClientSelect({ id: clientId, name: clientName });
    setQuery(clientName);
    setShowNewClientDialog(false);
    toast({
      title: "Cliente adicionado",
      description: "Cliente adicionado com sucesso ao agendamento.",
    });
  };

  // Handle client form cancel
  const handleClientFormCancel = () => {
    setShowNewClientDialog(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (query && query.length >= 2) {
      searchClients(query);
    }
  };

  return (
    <div className="relative">
      <div className="flex">
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Digite o nome ou telefone do cliente"
          className="w-full"
        />
        <Button 
          type="button"
          variant="outline"
          size="icon"
          className="ml-2 border-rose-200"
          onClick={handleNewClient}
        >
          <UserPlus className="h-4 w-4 text-rose-500" />
        </Button>
      </div>
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto"
        >
          <ul>
            {clients.length === 0 && query.length >= 2 && (
              <li className="px-4 py-2 text-muted-foreground">Nenhum cliente encontrado</li>
            )}
            
            {clients.map((client) => (
              <li
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className="px-4 py-2 hover:bg-muted cursor-pointer"
              >
                <div className="flex justify-between">
                  <span>{client.nome}</span>
                  <span className="text-sm text-muted-foreground">{client.telefone}</span>
                </div>
              </li>
            ))}
            
            {query.length >= 2 && (
              <li
                onClick={handleNewClient}
                className="px-4 py-2 hover:bg-rose-100 cursor-pointer flex items-center text-rose-500 font-medium border-t"
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar novo cliente: {query}
              </li>
            )}
          </ul>
        </div>
      )}
      
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar novo cliente</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo cliente
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            onSuccess={handleClientFormSuccess}
            onCancel={handleClientFormCancel}
            initialName={query}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
