
import { useState, useCallback } from 'react';
import { Expense, ServiceResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchExpenses = useCallback(async (): Promise<Expense[]> => {
    setLoading(true);
    try {
      // Note: Replace with actual table name if different
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const mappedExpenses: Expense[] = data.map(item => ({
          id: item.id,
          name: item.nome || item.name,
          amount: Number(item.valor || item.amount),
          date: item.data || item.date,
          category: item.categoria || item.category,
          isRecurring: item.recorrente || item.is_recurring || false,
          notes: item.observacoes || item.notes
        }));
        
        setExpenses(mappedExpenses);
        return mappedExpenses;
      }
      
      return [];
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar despesas';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addExpense = async (expense: Omit<Expense, "id">): Promise<ServiceResponse<Expense>> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('despesas')
        .insert({
          nome: expense.name,
          valor: expense.amount,
          data: expense.date,
          categoria: expense.category,
          recorrente: expense.isRecurring,
          observacoes: expense.notes
        })
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const newExpense: Expense = {
          id: data.id,
          name: data.nome || data.name,
          amount: Number(data.valor || data.amount),
          date: data.data || data.date,
          category: data.categoria || data.category,
          isRecurring: data.recorrente || data.is_recurring || false,
          notes: data.observacoes || data.notes
        };
        
        setExpenses(prev => [...prev, newExpense]);
        
        toast({
          title: 'Despesa adicionada',
          description: 'Despesa adicionada com sucesso'
        });
        
        return { data: newExpense };
      }
      
      return { error: 'Falha ao adicionar despesa' };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao adicionar despesa';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string): Promise<ServiceResponse<boolean>> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      toast({
        title: 'Despesa excluída',
        description: 'Despesa excluída com sucesso'
      });
      
      return { data: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao excluir despesa';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    addExpense,
    deleteExpense
  };
}
