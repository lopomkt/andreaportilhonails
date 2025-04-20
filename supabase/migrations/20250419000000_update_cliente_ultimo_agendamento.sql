
-- Check if data_ultimo_agendamento column exists in clientes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'clientes'
    AND column_name = 'data_ultimo_agendamento'
  ) THEN
    -- Add data_ultimo_agendamento column to clientes table
    ALTER TABLE public.clientes ADD COLUMN data_ultimo_agendamento TIMESTAMP WITH TIME ZONE;

    -- Update existing clients with their last appointment date
    UPDATE public.clientes c
    SET data_ultimo_agendamento = (
      SELECT MAX(a.data)
      FROM public.agendamentos a
      WHERE a.cliente_id = c.id
      AND a.status = 'confirmado'
    );
  END IF;
END $$;

-- Create or replace function to update client's last appointment date
CREATE OR REPLACE FUNCTION public.update_cliente_ultimo_agendamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the client's last appointment date when a new appointment is created or status changed
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status)) AND NEW.status = 'confirmado' THEN
    UPDATE public.clientes
    SET data_ultimo_agendamento = NEW.data
    WHERE id = NEW.cliente_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS tr_update_cliente_ultimo_agendamento ON public.agendamentos;

-- Create trigger to run the function after insert or update on agendamentos
CREATE TRIGGER tr_update_cliente_ultimo_agendamento
AFTER INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_cliente_ultimo_agendamento();

-- Create table for expenses if it doesn't exist
CREATE TABLE IF NOT EXISTS public.despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert sample motivational messages if table exists but has no data
INSERT INTO public.mensagens_motivacionais (mensagem)
SELECT mensagem
FROM (
  VALUES
  ('Você é capaz de tudo que sonha 💅'),
  ('Seu talento transforma vidas! ✨'),
  ('Cada cliente que sai feliz é um troféu para você 🏆'),
  ('Seu trabalho é arte em forma de beleza 💖'),
  ('Acredite no seu potencial, você é incrível! 💪'),
  ('Pequenos progressos levam a grandes resultados 🌱'),
  ('Sua dedicação faz toda a diferença! 🌟'),
  ('Nunca subestime o poder de unhas bem feitas 💅'),
  ('Espalhe beleza e colha sorrisos 😊'),
  ('Seu sucesso é construído dia após dia 🧱')
) AS m(mensagem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.mensagens_motivacionais
  LIMIT 1
);
