-- Fix critical security vulnerability: Remove anonymous access to customer data
-- Drop the overly permissive policies that allow public access
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.clientes;
DROP POLICY IF EXISTS "Allow delete access to all users" ON public.clientes;
DROP POLICY IF EXISTS "Allow select access to all users" ON public.clientes;
DROP POLICY IF EXISTS "Allow update access to all users" ON public.clientes;

-- Keep only the authenticated user policies (these are secure)
-- The following policies already exist and are properly secured:
-- - "Usuários autenticados podem atualizar clientes" 
-- - "Usuários autenticados podem excluir clientes" 
-- - "Usuários autenticados podem inserir clientes" 
-- - "Usuários autenticados podem ver todos os clientes"

-- Verify RLS is enabled (should already be enabled)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;