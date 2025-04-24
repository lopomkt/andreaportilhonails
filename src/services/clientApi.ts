import { Client, ServiceResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapDbClientToApp } from '@/integrations/supabase/mappers';

export async function fetchClientsFromApi(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome', { ascending: true });
  
  if (error) {
    console.error("Error fetching clients:", error);
    throw error;
  }

  if (!data || !Array.isArray(data)) {
    console.warn("Data from API is not an array or is null:", data);
    return [];
  }

  return data.map(mapDbClientToApp);
}

export async function createClientInApi(clientData: Partial<Client>): Promise<ServiceResponse<Client>> {
  if (!clientData.name || !clientData.phone) {
    throw new Error('Nome e telefone são obrigatórios');
  }
  
  const dataToInsert = {
    nome: clientData.name,
    telefone: clientData.phone,
    email: clientData.email || null,
    observacoes: clientData.notes || null,
    data_nascimento: clientData.birthdate || null,
    valor_total: clientData.totalSpent || 0,
    data_criacao: new Date().toISOString(),
    ultimo_agendamento: clientData.lastAppointment || null,
    data_ultimo_agendamento: clientData.lastAppointment || null
  };
  
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
      return { error: 'Falha ao criar cliente: Nenhum dado retornado' };
    }
    
    const newClient = mapDbClientToApp(data);
    return { data: newClient };
  } catch (err: any) {
    console.error('Unexpected error creating client:', err);
    return { error: err.message || 'Erro inesperado ao criar cliente' };
  }
}

export async function updateClientInApi(clientId: string, clientData: Partial<Client>): Promise<ServiceResponse<Client>> {
  const updateData: Record<string, any> = {};
  
  if (clientData.name !== undefined) updateData.nome = clientData.name;
  if (clientData.phone !== undefined) updateData.telefone = clientData.phone;
  if (clientData.email !== undefined) updateData.email = clientData.email;
  if (clientData.notes !== undefined) updateData.observacoes = clientData.notes;
  if (clientData.birthdate !== undefined) updateData.data_nascimento = clientData.birthdate;
  if (clientData.totalSpent !== undefined) updateData.valor_total = clientData.totalSpent;
  if (clientData.lastAppointment !== undefined) {
    updateData.ultimo_agendamento = clientData.lastAppointment;
    updateData.data_ultimo_agendamento = clientData.lastAppointment;
  }
  
  const { data, error } = await supabase
    .from('clientes')
    .update(updateData)
    .eq('id', clientId)
    .select('*')
    .single();
    
  if (error) {
    return { error: error.message };
  }
  
  if (data) {
    const updatedClient = mapDbClientToApp(data);
    return { data: updatedClient };
  }
  
  return { error: 'Falha ao atualizar cliente' };
}

export async function deleteClientInApi(clientId: string): Promise<ServiceResponse<boolean>> {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', clientId);
    
  if (error) {
    return { error: error.message };
  }
  
  return { data: true };
}
