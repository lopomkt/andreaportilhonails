import { useState, useCallback } from 'react';
import { Expense, ServiceResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// Mapper functions
function mapDbExpenseToApp(dbExpense: any): Expense {
  return {
    id: dbExpense.id,
    name: dbExpense.descricao,
    amount: Number(dbExpense.valor) || 0,
    date: dbExpense.data_despesa,
    category: dbExpense.categoria || undefined,
    isRecurring: false, // Não existe no banco ainda
    notes: dbExpense.observacoes || undefined
  };
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get expenses for a specific month and year
  const getExpensesForMonth = useCallback((month: number, year: number) => {
    const startDate = startOfMonth(new Date(year, month, 1));
    const endDate = endOfMonth(startDate);
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: startDate, end: endDate });
    });
  }, [expenses]);

  // Calculate total expenses for a specific month and year
  const calculateMonthlyExpenses = useCallback((month: number, year: number) => {
    const monthlyExpenses = getExpensesForMonth(month, year);
    return monthlyExpenses.reduce((total, expense) => total + expense.amount, 0);
  }, [getExpensesForMonth]);

  const fetchExpenses = useCallback(async (): Promise<Expense[]> => {
    setLoading(true);
    try {
      console.log("Fetching expenses from database...");
      
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .order('data_despesa', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const mappedExpenses: Expense[] = data.map(mapDbExpenseToApp);
        console.log(`Fetched ${mappedExpenses.length} expenses`);
        setExpenses(mappedExpenses);
        return mappedExpenses;
      }
      
      return [];
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao buscar despesas';
      console.error("Error fetching expenses:", errorMessage);
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
      
      // Validate required fields
      if (!expense.name || expense.amount === undefined || !expense.date) {
        const errorMsg = 'Erro: Campos obrigatórios não preenchidos (nome, valor e data)';
        toast({
          title: 'Campos obrigatórios',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }

      // Get current user ID for RLS
      const userId = await getCurrentUserId();
      if (!userId) {
        const errorMsg = 'Usuário não autenticado';
        toast({
          title: 'Erro',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
      const { data, error } = await supabase
        .from('despesas')
        .insert({
          descricao: expense.name,
          valor: expense.amount,
          data_despesa: expense.date,
          categoria: expense.category || null,
          observacoes: expense.notes || null,
          user_id: userId
        })
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const newExpense = mapDbExpenseToApp(data);
        setExpenses(prev => [newExpense, ...prev]);
        
        toast({
          title: 'Despesa adicionada',
          description: 'Despesa adicionada com sucesso'
        });
        
        return { data: newExpense, success: true };
      }
      
      return { error: 'Falha ao adicionar despesa', success: false };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao adicionar despesa';
      console.error("Error adding expense:", errorMessage);
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (expense: Expense): Promise<ServiceResponse<Expense>> => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!expense.id || !expense.name || expense.amount === undefined || !expense.date) {
        const errorMsg = 'Erro: Campos obrigatórios não preenchidos';
        toast({
          title: 'Campos obrigatórios',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
      const { data, error } = await supabase
        .from('despesas')
        .update({
          descricao: expense.name,
          valor: expense.amount,
          data_despesa: expense.date,
          categoria: expense.category || null,
          observacoes: expense.notes || null
        })
        .eq('id', expense.id)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const updatedExpense = mapDbExpenseToApp(data);
        setExpenses(prev => 
          prev.map(item => item.id === updatedExpense.id ? updatedExpense : item)
        );
        
        toast({
          title: 'Despesa atualizada',
          description: 'Despesa atualizada com sucesso'
        });
        
        return { data: updatedExpense, success: true };
      }
      
      return { error: 'Falha ao atualizar despesa', success: false };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao atualizar despesa';
      console.error("Error updating expense:", errorMessage);
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string): Promise<ServiceResponse<boolean>> => {
    try {
      setLoading(true);
      
      if (!id) {
        const errorMsg = 'Erro: ID da despesa não fornecido';
        toast({
          title: 'Erro',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
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
      
      return { data: true, success: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao excluir despesa';
      console.error("Error deleting expense:", errorMessage);
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return { error: errorMessage, success: false };
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
    updateExpense,
    deleteExpense,
    getExpensesForMonth,
    calculateMonthlyExpenses
  };
}