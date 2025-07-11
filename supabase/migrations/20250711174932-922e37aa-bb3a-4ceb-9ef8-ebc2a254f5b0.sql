-- Habilitar RLS nas tabelas que não têm políticas completas
ALTER TABLE IF EXISTS agendamentos_novo ENABLE ROW LEVEL SECURITY;

-- Criar políticas para agendamentos_novo (permitir leitura, atualização e exclusão)
CREATE POLICY IF NOT EXISTS "Allow select access to all users"
ON agendamentos_novo FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Allow update access to all users"
ON agendamentos_novo FOR UPDATE
USING (true);

CREATE POLICY IF NOT EXISTS "Allow delete access to all users"
ON agendamentos_novo FOR DELETE
USING (true);

-- Habilitar RLS e criar políticas para outras tabelas
ALTER TABLE IF EXISTS mensagens_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to message templates"
ON mensagens_templates FOR ALL
USING (true);

ALTER TABLE IF EXISTS datas_bloqueadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to blocked dates"
ON datas_bloqueadas FOR ALL
USING (true);

ALTER TABLE IF EXISTS motivos_cancelamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to cancellation reasons"
ON motivos_cancelamento FOR ALL
USING (true);

ALTER TABLE IF EXISTS mensagens_motivacionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to motivational messages"
ON mensagens_motivacionais FOR ALL
USING (true);

ALTER TABLE IF EXISTS configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to configurations"
ON configuracoes FOR ALL
USING (true);

ALTER TABLE IF EXISTS ultima_mensagem_vista ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to last viewed message"
ON ultima_mensagem_vista FOR ALL
USING (true);