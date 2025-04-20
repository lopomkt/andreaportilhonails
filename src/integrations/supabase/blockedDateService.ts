
import { supabase } from './client';
import { BlockedDate } from '@/types';

export const BlockedDateService = {
  async create(data: { date: string; reason?: string; allDay?: boolean }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('datas_bloqueadas')
        .insert({
          data: data.date,
          motivo: data.reason || null,
          dia_todo: data.allDay || true
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
        allDay: item.dia_todo,
        dia_todo: item.dia_todo
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
