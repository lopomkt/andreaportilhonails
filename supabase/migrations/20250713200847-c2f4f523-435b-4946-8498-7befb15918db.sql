-- Adicionar coluna motivo_cancelamento na tabela agendamentos_novo se não existir
ALTER TABLE agendamentos_novo 
ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;