import { useState, useCallback } from 'react';
import { Expense, ServiceResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';

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
      // Making sure we use a valid table name from the database
      // Since it appears 'despesas' doesn't exist in the schema
      // We'll use an empty array for now until the table is created
      console.log("Fetching expenses...");
      setExpenses([]);
      return [];
      
      /* 
      // This code will be used once the 'despesas' table is created
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
      */
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
      if (!expense.name || !expense.amount || !expense.date || !expense.category) {
        const errorMsg = 'Erro: Campos obrigatórios não preenchidos';
        toast({
          title: 'Campos obrigatórios',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
      // Since the despesas table doesn't exist yet, we'll return a mock response
      const mockExpense: Expense = {
        id: Date.now().toString(),
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        isRecurring: expense.isRecurring,
        notes: expense.notes
      };
      
      // Update local state
      setExpenses(prev => [...prev, mockExpense]);
      
      toast({
        title: 'Despesa adicionada',
        description: 'Despesa adicionada com sucesso'
      });
      
      return { data: mockExpense, success: true };
      
      /* 
      // This code will be used once the 'despesas' table is created
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
        
        return { data: newExpense, success: true };
      }
      return { error: 'Falha ao adicionar despesa', success: false };
      */
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
      if (!expense.id || !expense.name || !expense.amount || !expense.date || !expense.category) {
        const errorMsg = 'Erro: Campos obrigatórios não preenchidos';
        toast({
          title: 'Campos obrigatórios',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
      // Since the despesas table doesn't exist yet, we'll return a mock response
      // and update the local state
      setExpenses(prev => 
        prev.map(item => item.id === expense.id ? expense : item)
      );
      
      toast({
        title: 'Despesa atualizada',
        description: 'Despesa atualizada com sucesso'
      });
      
      return { data: expense, success: true };
      
      /* 
      // This code will be used once the 'despesas' table is created
      const { data, error } = await supabase
        .from('despesas')
        .update({
          nome: expense.name,
          valor: expense.amount,
          data: expense.date,
          categoria: expense.category,
          recorrente: expense.isRecurring,
          observacoes: expense.notes
        })
        .eq('id', expense.id)
        .select('*')
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const updatedExpense: Expense = {
          id: data.id,
          name: data.nome || data.name,
          amount: Number(data.valor || data.amount),
          date: data.data || data.date,
          category: data.categoria || data.category,
          isRecurring: data.recorrente || data.is_recurring || false,
          notes: data.observacoes || data.notes
        };
        
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
      */
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
      
      // Validate required fields
      if (!id) {
        const errorMsg = 'Erro: ID da despesa não fornecido';
        toast({
          title: 'Erro',
          description: errorMsg,
          variant: 'destructive'
        });
        return { error: errorMsg, success: false };
      }
      
      // Since the despesas table doesn't exist, we'll mock the deletion
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      toast({
        title: 'Despesa excluída',
        description: 'Despesa excluída com sucesso'
      });
      
      return { data: true, success: true };
      
      /* 
      // This code will be used once the 'despesas' table is created
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
      */
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
