
import React from 'react';
import { ClientAutocomplete } from '../ClientAutocomplete';
import { Client } from '@/types';

interface ClientSearchProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
}

export const ClientSearch: React.FC<ClientSearchProps> = ({ selectedClient, onClientSelect }) => {
  return (
    <ClientAutocomplete
      selectedClient={selectedClient}
      onClientSelect={onClientSelect}
      autofocus={true}
      placeholder="Pesquisar cliente pelo nome ou telefone..."
    />
  );
};
