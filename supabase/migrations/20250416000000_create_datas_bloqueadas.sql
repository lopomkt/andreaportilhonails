
-- Ensure datas_bloqueadas table exists
CREATE TABLE IF NOT EXISTS public.datas_bloqueadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  motivo TEXT,
  dia_todo BOOLEAN NOT NULL DEFAULT true,
  valor TEXT,
  descricao TEXT
);

-- Add comment to the table
COMMENT ON TABLE public.datas_bloqueadas IS 'Tabela para armazenar datas bloqueadas no calendário';
