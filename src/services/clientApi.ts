import { Client, ServiceResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapDbClientToApp, mapAppClientToDb } from '@/integrations/supabase/mappers';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function fetchClientsFromApi(): Promise<Client[]> {
  console.log("Fetching clients from API...");
  try {
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
  } catch (err) {
    console.error("Unexpected error fetching clients:", err);
    return [];
  }
}

export async function createClientInApi(clientData: Partial<Client>): Promise<ServiceResponse<Client>> {
  console.log("Creating client with data:", clientData);
  
  if (!clientData.name || !clientData.phone) {
    console.error("Missing required fields");
    return { error: 'Nome e telefone são obrigatórios', success: false };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.error("User not authenticated");
    return { error: 'Usuário não autenticado', success: false };
  }
  
  const mappedData = mapAppClientToDb({
    id: '',
    name: clientData.name,
    phone: clientData.phone,
    email: clientData.email || '',
    notes: clientData.notes || '',
    birthdate: clientData.birthdate || undefined,
    totalSpent: 0,
    lastAppointment: undefined,
    createdAt: new Date().toISOString()
  }, userId);
  
  // Remove id para inserção
  const { id, ...dataToInsert } = mappedData;
  
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert(dataToInsert)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error creating client:', error);
      return { error: error.message, success: false };
    }
    
    if (!data) {
      console.error('No data returned after client creation');
      return { error: 'Falha ao criar cliente: Nenhum dado retornado', success: false };
    }
    
    console.log("Client created successfully:", data);
    const newClient = mapDbClientToApp(data);
    return { data: newClient, success: true };
  } catch (err: any) {
    console.error('Unexpected error creating client:', err);
    return { error: err.message || 'Erro inesperado ao criar cliente', success: false };
  }
}

export async function updateClientInApi(clientId: string, clientData: Partial<Client>): Promise<ServiceResponse<Client>> {
  console.log("Updating client:", clientId, "with data:", clientData);
  
  if (!clientId) {
    return { error: 'ID do cliente não fornecido', success: false };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.error("User not authenticated");
    return { error: 'Usuário não autenticado', success: false };
  }
  
  // Monta apenas os campos que foram passados para atualização
  const updateData: Record<string, any> = {};
  
  if (clientData.name !== undefined) updateData.nome = clientData.name;
  if (clientData.phone !== undefined) updateData.telefone = clientData.phone;
  if (clientData.email !== undefined) updateData.email = clientData.email || null;
  if (clientData.notes !== undefined) updateData.observacoes = clientData.notes || null;
  if (clientData.birthdate !== undefined) updateData.data_nascimento = clientData.birthdate || null;
  if (clientData.totalSpent !== undefined) updateData.valor_total = clientData.totalSpent;
  if (clientData.lastAppointment !== undefined) {
    updateData.ultimo_agendamento = clientData.lastAppointment || null;
    updateData.data_ultimo_agendamento = clientData.lastAppointment || null;
  }
  
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(updateData)
      .eq('id', clientId)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating client:', error);
      return { error: error.message, success: false };
    }
    
    if (!data) {
      console.error('No data returned after client update');
      return { error: 'Falha ao atualizar cliente', success: false };
    }
    
    console.log("Client updated successfully:", data);
    const updatedClient = mapDbClientToApp(data);
    return { data: updatedClient, success: true };
  } catch (err: any) {
    console.error('Error updating client:', err);
    return { error: err.message || 'Erro ao atualizar cliente', success: false };
  }
}

export async function deleteClientInApi(clientId: string): Promise<ServiceResponse<boolean>> {
  console.log("Deleting client:", clientId);
  
  if (!clientId) {
    return { error: 'ID do cliente não fornecido', success: false };
  }
  
  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clientId);
      
    if (error) {
      console.error('Error deleting client:', error);
      return { error: error.message, success: false };
    }
    
    console.log("Client deleted successfully");
    return { data: true, success: true };
  } catch (err: any) {
    console.error('Unexpected error deleting client:', err);
    return { error: err.message || 'Erro ao excluir cliente', success: false };
  }
}
