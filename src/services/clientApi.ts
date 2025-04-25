
import { Client, ServiceResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapDbClientToApp, mapAppClientToDb } from '@/integrations/supabase/mappers';

export async function fetchClientsFromApi(): Promise<Client[]> {
  console.log("Fetching clients from API...");
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome', { ascending: true });
  
  if (error) {
    console.error("Error fetching clients:", error);
    throw error;
  }

  if (!data) {
    console.warn("No data returned from API");
    return [];
  }

  const mappedClients = data.map(mapDbClientToApp);
  console.log("Fetched and mapped clients:", mappedClients);
  return mappedClients;
}

export async function createClientInApi(clientData: Partial<Client>): Promise<ServiceResponse<Client>> {
  console.log("Creating client with data:", clientData);
  
  if (!clientData.name || !clientData.phone) {
    console.error("Missing required fields");
    return { error: 'Nome e telefone são obrigatórios' };
  }
  
  const dataToInsert = mapAppClientToDb({
    id: '',
    name: clientData.name,
    phone: clientData.phone,
    email: clientData.email,
    notes: clientData.notes,
    birthdate: clientData.birthdate,
    totalSpent: 0,
    lastAppointment: null,
    createdAt: new Date().toISOString()
  });
  
  delete dataToInsert.id;
  
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert(dataToInsert)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error creating client:', error);
      return { error: error.message };
    }
    
    if (!data) {
      console.error('No data returned after client creation');
      return { error: 'Falha ao criar cliente: Nenhum dado retornado' };
    }
    
    console.log("Client created successfully:", data);
    const newClient = mapDbClientToApp(data);
    return { data: newClient };
  } catch (err: any) {
    console.error('Unexpected error creating client:', err);
    return { error: err.message || 'Erro inesperado ao criar cliente' };
  }
}

export async function updateClientInApi(clientId: string, clientData: Partial<Client>): Promise<ServiceResponse<Client>> {
  console.log("Updating client:", clientId, "with data:", clientData);
  
  const updateData = mapAppClientToDb({
    id: clientId,
    ...clientData,
    createdAt: new Date().toISOString()
  });
  
  delete updateData.id;
  
  const { data, error } = await supabase
    .from('clientes')
    .update(updateData)
    .eq('id', clientId)
    .select('*')
    .single();
    
  if (error) {
    console.error('Error updating client:', error);
    return { error: error.message };
  }
  
  if (!data) {
    console.error('No data returned after client update');
    return { error: 'Falha ao atualizar cliente' };
  }
  
  console.log("Client updated successfully:", data);
  const updatedClient = mapDbClientToApp(data);
  return { data: updatedClient };
}

export async function deleteClientInApi(clientId: string): Promise<ServiceResponse<boolean>> {
  console.log("Deleting client:", clientId);
  
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', clientId);
    
  if (error) {
    console.error('Error deleting client:', error);
    return { error: error.message };
  }
  
  console.log("Client deleted successfully");
  return { data: true };
}
