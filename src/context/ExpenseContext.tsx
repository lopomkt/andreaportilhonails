
import React, { createContext, useContext, useState } from "react";
import { Expense } from "@/types";
import { useExpenseContext as useExpenseHook } from "@/hooks/useExpenseContext";

interface ExpenseContextType {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  addExpense: (expense: Omit<Expense, "id">) => Promise<any>;
  updateExpense: (expense: Expense) => Promise<any>;
  deleteExpense: (id: string) => Promise<any>;
  fetchExpenses: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType>({
  expenses: [],
  loading: false,
  error: null,
  addExpense: async () => ({}),
  updateExpense: async () => ({}),
  deleteExpense: async () => ({}),
  fetchExpenses: async () => {},
});

export const ExpenseProvider = ({ children }: { children: React.ReactNode }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const expenseContext = useExpenseHook(expenses, setExpenses);

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        loading: false,
        error: null,
        addExpense: expenseContext.addExpense,
        updateExpense: expenseContext.updateExpense,
        deleteExpense: expenseContext.deleteExpense,
        fetchExpenses: expenseContext.fetchExpenses,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
};
