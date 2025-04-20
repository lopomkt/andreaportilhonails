import React, { useState, useEffect } from 'react';
import { ClientAutocomplete } from './ClientAutocomplete';
import { ClientForm } from './ClientForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { verifySupabaseConnection } from '@/utils/supabaseConnectionCheck';
import { useToast } from '@/hooks/use-toast';

// This component will wrap the AppointmentForm but intercept and modify specific parts
// For now, focusing on wrapping the client selection with our new autocomplete component

export function AppointmentFormWrapper({ children }: { children: React.ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const { toast } = useToast();

  // Find and replace the client selection dropdown with our autocomplete
  const recursivelyModifyChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, child => {
      if (!React.isValidElement(child)) {
        return child;
      }

      // Check if this is the client selection form field
      if (child.props && 
          child.props.name === 'clientId' && 
          child.props.control && 
          child.props.render) {
        
        // Replace with our custom render function that includes the autocomplete
        return React.cloneElement(child, {
          ...child.props,
          render: ({ field }: any) => {
            // Save the original render function
            const originalRender = child.props.render;
            
            // Check if we want to render our autocomplete
            if (field && field.onChange) {
              // Set up connection between autocomplete and form field
              const handleClientSelect = (client: { id: string; name: string }) => {
                field.onChange(client.id);
                setSelectedClient(client);
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
            
            // Otherwise fall back to the original render
            return originalRender({ field });
          }
        });
      }

      // Recursively check all children
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

  // The component just returns the modified children
  return (
    <>
      {modifiedChildren}
      
      {/* Dialog for new client form */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar novo cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSuccess={(clientId, clientName) => {
              setSelectedClient({ id: clientId, name: clientName });
              setShowNewClientDialog(false);
            }}
            onCancel={() => setShowNewClientDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
