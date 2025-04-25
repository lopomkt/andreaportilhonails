
import { Client } from '@/types';
import { ClientCard } from './ClientCard';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ClientForm from './ClientForm';
import { useToast } from '@/hooks/use-toast';

interface ClientsListProps {
  clients: Client[];
  onClientAdded: () => Promise<void>;
}

export function ClientsList({ clients, onClientAdded }: ClientsListProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsViewingDetails(true);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsEditing(true);
    setIsViewingDetails(false);
  };

  const handleScheduleClick = (client: Client) => {
    // Este é um placeholder para a funcionalidade de agendamento
    toast({
      title: "Função não implementada",
      description: "O agendamento será implementado em breve."
    });
  };

  const handleSuccess = async () => {
    await onClientAdded();
    setIsEditing(false);
    setIsViewingDetails(false);
    toast({
      title: "Sucesso",
      description: "Cliente salvo com sucesso!"
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.length === 0 ? (
        <div className="col-span-full text-center py-10">
          <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onViewDetails={() => handleViewDetails(client)}
            onEditClick={() => handleEditClick(client)}
            onScheduleClick={() => handleScheduleClick(client)}
          />
        ))
      )}

      {/* Modal de detalhes do cliente */}
      <Dialog open={isViewingDetails} onOpenChange={setIsViewingDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedClient?.name}</DialogTitle>
            <DialogDescription>Detalhes do cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Telefone</p>
              <p>{selectedClient?.phone}</p>
            </div>
            {selectedClient?.email && (
              <div>
                <p className="text-sm font-medium">Email</p>
                <p>{selectedClient?.email}</p>
              </div>
            )}
            {selectedClient?.birthdate && (
              <div>
                <p className="text-sm font-medium">Data de nascimento</p>
                <p>{new Date(selectedClient.birthdate).toLocaleDateString()}</p>
              </div>
            )}
            {selectedClient?.notes && (
              <div>
                <p className="text-sm font-medium">Observações</p>
                <p className="whitespace-pre-wrap">{selectedClient.notes}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <button
                className="px-4 py-2 border rounded bg-nail-500 hover:bg-nail-600 text-white"
                onClick={() => {
                  setIsViewingDetails(false);
                  if (selectedClient) handleEditClick(selectedClient);
                }}
              >
                Editar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edição do cliente */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedClient ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <ClientForm
              client={selectedClient}
              onSuccess={handleSuccess}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
