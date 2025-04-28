
import { supabase } from './client';
import { BlockedDate } from '@/types';

export const BlockedDateService = {
  async create(data: { 
    date: string; 
    reason?: string; 
    allDay?: boolean;
    valor?: string; // Start time
    descricao?: string; // End time or description
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('datas_bloqueadas')
        .insert({
          data: data.date,
          motivo: data.reason || null,
          dia_todo: data.allDay || false,
          valor: data.valor || null, // Store start time
          descricao: data.descricao || null // Store end time or description
        });

      if (error) {
        console.error('Error creating blocked date:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error creating blocked date:', error);
      return false;
    }
  },

  async update(id: string, data: { 
    date?: string; 
    reason?: string; 
    allDay?: boolean;
    valor?: string; // Start time
    descricao?: string; // End time or description
  }): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (data.date) updateData.data = data.date;
      if (data.reason !== undefined) updateData.motivo = data.reason;
      if (data.allDay !== undefined) updateData.dia_todo = data.allDay;
      if (data.valor !== undefined) updateData.valor = data.valor;
      if (data.descricao !== undefined) updateData.descricao = data.descricao;
      
      const { error } = await supabase
        .from('datas_bloqueadas')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating blocked date:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error updating blocked date:', error);
      return false;
    }
  },

  async getAll(): Promise<BlockedDate[]> {
    try {
      const { data, error } = await supabase
        .from('datas_bloqueadas')
        .select('*')
        .order('data', { ascending: true });
      
      if (error) {
        console.error("Error fetching blocked dates:", error);
        return [];
      }
      
      return data?.map(item => ({
        id: item.id,
        date: item.data,
        reason: item.motivo || "",
        motivo: item.motivo || "",
        description: item.descricao || "",
        allDay: item.dia_todo,
        dia_todo: item.dia_todo,
        valor: item.valor || "" // Include start time
      })) || [];
    } catch (err) {
      console.error("Unexpected error fetching blocked dates:", err);
      return [];
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('datas_bloqueadas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting blocked date:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting blocked date:', error);
      return false;
    }
  }
};
