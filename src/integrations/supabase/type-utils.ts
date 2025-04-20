
// Type utilities for Supabase
import { Database } from './types';

// Simplified type helpers to make working with Supabase tables easier
export type Tables = Database['public']['Tables'];
export type TablesInsert<T extends keyof Tables> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Tables> = Database['public']['Tables'][T]['Update'];
export type TablesRow<T extends keyof Tables> = Database['public']['Tables'][T]['Row'];
export type Enums = Database['public']['Enums'];

// Helper functions to transform table names to their types
export const tableNames = {
  agendamentos: 'agendamentos',
  clientes: 'clientes',
  servicos: 'servicos',
  configuracoes: 'configuracoes',
  datas_bloqueadas: 'datas_bloqueadas',
  mensagens_motivacionais: 'mensagens_motivacionais'
} as const;

export type TableName = keyof typeof tableNames;
