-- Habilitar RLS nas tabelas que não têm políticas completas
ALTER TABLE agendamentos_novo ENABLE ROW LEVEL SECURITY;

-- Apagar políticas antigas se existirem e criar novas
DROP POLICY IF EXISTS "Allow select access to all users" ON agendamentos_novo;
DROP POLICY IF EXISTS "Allow update access to all users" ON agendamentos_novo;
DROP POLICY IF EXISTS "Allow delete access to all users" ON agendamentos_novo;

-- Criar políticas para agendamentos_novo (permitir leitura, atualização e exclusão)
CREATE POLICY "Allow select access to all users"
ON agendamentos_novo FOR SELECT
USING (true);

CREATE POLICY "Allow update access to all users"
ON agendamentos_novo FOR UPDATE
USING (true);

CREATE POLICY "Allow delete access to all users"
ON agendamentos_novo FOR DELETE
USING (true);

-- Habilitar RLS e criar políticas para outras tabelas
ALTER TABLE mensagens_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to message templates" ON mensagens_templates;
CREATE POLICY "Allow all access to message templates"
ON mensagens_templates FOR ALL
USING (true);

ALTER TABLE datas_bloqueadas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to blocked dates" ON datas_bloqueadas;
CREATE POLICY "Allow all access to blocked dates"
ON datas_bloqueadas FOR ALL
USING (true);

ALTER TABLE motivos_cancelamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to cancellation reasons" ON motivos_cancelamento;
CREATE POLICY "Allow all access to cancellation reasons"
ON motivos_cancelamento FOR ALL
USING (true);

ALTER TABLE mensagens_motivacionais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to motivational messages" ON mensagens_motivacionais;
CREATE POLICY "Allow all access to motivational messages"
ON mensagens_motivacionais FOR ALL
USING (true);

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to configurations" ON configuracoes;
CREATE POLICY "Allow all access to configurations"
ON configuracoes FOR ALL
USING (true);

ALTER TABLE ultima_mensagem_vista ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to last viewed message" ON ultima_mensagem_vista;
CREATE POLICY "Allow all access to last viewed message"
ON ultima_mensagem_vista FOR ALL
USING (true);