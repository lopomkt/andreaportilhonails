-- Adicionar coluna user_id às tabelas existentes e criar tabela despesas
-- Adicionar coluna user_id à tabela clientes
ALTER TABLE public.clientes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar coluna user_id à tabela agendamentos_novo
ALTER TABLE public.agendamentos_novo ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar tabela despesas com coluna user_id
CREATE TABLE public.despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  data_despesa TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  categoria TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilita RLS para a tabela de clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Cria a política que permite acesso total apenas aos registros do próprio usuário
CREATE POLICY "Permitir acesso total para o próprio usuário nos seus clientes"
ON public.clientes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Habilita RLS para a tabela de agendamentos
ALTER TABLE public.agendamentos_novo ENABLE ROW LEVEL SECURITY;

-- Cria a política que permite acesso total apenas aos registros do próprio usuário
CREATE POLICY "Permitir acesso total para o próprio usuário nos seus agendamentos"
ON public.agendamentos_novo
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Habilita RLS para a tabela de despesas
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- Cria a política que permite acesso total apenas aos registros do próprio usuário
CREATE POLICY "Permitir acesso total para o próprio usuário nas suas despesas"
ON public.despesas
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);