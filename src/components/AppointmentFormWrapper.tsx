
import React, { useState, useEffect } from 'react';
import { ClientAutocomplete } from './ClientAutocomplete';
import ClientForm from './ClientForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types';

export function AppointmentFormWrapper({ children }: { children: React.ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const { toast } = useToast();

  const recursivelyModifyChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, child => {
      if (!React.isValidElement(child)) {
        return child;
      }

      if (child.props && 
          child.props.name === 'clientId' && 
          child.props.control && 
          child.props.render) {
        
        return React.cloneElement(child, {
          ...child.props,
          render: ({ field }: any) => {
            const originalRender = child.props.render;
            
            if (field && field.onChange) {
              const handleClientSelect = (client: Client | null) => {
                if (client && client.id) {
                  field.onChange(client.id);
                  setSelectedClient(client);
                }
              };

              return (
                <div>
                  <ClientAutocomplete 
                    onClientSelect={handleClientSelect}
                    selectedClient={selectedClient}
                  />
                </div>
              );
            }
            
            return originalRender({ field });
          }
        });
      }

      if (child.props && child.props.children) {
        const modifiedChildren = recursivelyModifyChildren(child.props.children);
        return React.cloneElement(child, {
          ...child.props,
          children: modifiedChildren
        });
      }

      return child;
    });
  };

  const modifiedChildren = recursivelyModifyChildren(children);

  // Handle success with proper encapsulation
  const handleSuccess = (newClient: Client | null) => {
    if (newClient) {
      setShowNewClientDialog(false);
      toast({
        title: "Cliente cadastrado com sucesso!",
        description: "Cliente adicionado ao sistema."
      });
    }
  };

  // Handle cancel with proper encapsulation 
  const handleCancel = () => {
    setShowNewClientDialog(false);
  };

  return (
    <>
      {modifiedChildren}
      
      <Dialog open={showNewClientDialog} onOpenChange={() => setShowNewClientDialog(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar novo cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSuccess={() => handleSuccess(selectedClient)}
            onCancel={() => handleCancel()}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
