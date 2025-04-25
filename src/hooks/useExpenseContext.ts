
import { Expense } from '@/types';
import { useCallback } from 'react';

export const useExpenseContext = (
  expenses: Expense[],
  setExpenses?: React.Dispatch<React.SetStateAction<Expense[]>>
) => {
  const fetchExpenses = async (): Promise<void> => {
    // Implementação existente ou mock
    return;
  };

  const addExpense = useCallback(async (expense: Omit<Expense, "id">) => {
    if (!expense) {
      return { success: false, error: "Invalid expense data" };
    }
    
    if (setExpenses) {
      const newExpense = {
        ...expense,
        id: `exp-${Date.now()}`, // Mock ID generation for now
      };
      setExpenses(prev => [...prev, newExpense]);
      return { success: true, data: newExpense };
    }
    
    return { success: false, error: "AddExpense function not available" };
  }, [setExpenses]);

  const updateExpense = useCallback(async (expense: Expense) => {
    if (!expense || !expense.id) {
      return { success: false, error: "Invalid expense data" };
    }
    
    if (setExpenses) {
      setExpenses(prev => 
        prev.map(item => item.id === expense.id ? expense : item)
      );
      return { success: true };
    }
    
    return { success: false, error: "UpdateExpense function not available" };
  }, [setExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!id) {
      return { success: false, error: "Invalid expense ID" };
    }
    
    if (setExpenses) {
      setExpenses(prev => prev.filter(item => item.id !== id));
      return { success: true };
    }
    
    return { success: false, error: "DeleteExpense function not available" };
  }, [setExpenses]);

  return {
    expenses,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense
  };
};
