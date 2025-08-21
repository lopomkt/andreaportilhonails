
-- 1) Lock down agendamentos_novo (appointments)
alter table public.agendamentos_novo enable row level security;

drop policy if exists "Allow delete access to all users" on public.agendamentos_novo;
drop policy if exists "Allow select access to all users" on public.agendamentos_novo;
drop policy if exists "Allow update access to all users" on public.agendamentos_novo;
drop policy if exists "Enable insert for all users" on public.agendamentos_novo;

create policy "Authenticated can select agendamentos"
  on public.agendamentos_novo for select
  to authenticated
  using (true);

create policy "Authenticated can insert agendamentos"
  on public.agendamentos_novo for insert
  to authenticated
  with check (true);

create policy "Authenticated can update agendamentos"
  on public.agendamentos_novo for update
  to authenticated
  using (true);

create policy "Authenticated can delete agendamentos"
  on public.agendamentos_novo for delete
  to authenticated
  using (true);

-- 2) Lock down servicos (services)
alter table public.servicos enable row level security;

drop policy if exists "Allow anonymous inserts" on public.servicos;
drop policy if exists "Allow authenticated inserts" on public.servicos;
drop policy if exists "Allow delete access to all users" on public.servicos;
drop policy if exists "Allow select access to all users" on public.servicos;
drop policy if exists "Allow update access to all users" on public.servicos;

create policy "Authenticated can select servicos"
  on public.servicos for select
  to authenticated
  using (true);

create policy "Authenticated can insert servicos"
  on public.servicos for insert
  to authenticated
  with check (true);

create policy "Authenticated can update servicos"
  on public.servicos for update
  to authenticated
  using (true);

create policy "Authenticated can delete servicos"
  on public.servicos for delete
  to authenticated
  using (true);

-- 3) Lock down datas_bloqueadas (blocked dates)
alter table public.datas_bloqueadas enable row level security;
drop policy if exists "Allow all access to blocked dates" on public.datas_bloqueadas;

create policy "Authenticated full access to datas_bloqueadas"
  on public.datas_bloqueadas
  to authenticated
  using (true)
  with check (true);

-- 4) Lock down configuracoes (configurations)
alter table public.configuracoes enable row level security;
drop policy if exists "Allow all access to configurations" on public.configuracoes;

create policy "Authenticated full access to configuracoes"
  on public.configuracoes
  to authenticated
  using (true)
  with check (true);

-- 5) Lock down mensagens_motivacionais
alter table public.mensagens_motivacionais enable row level security;
drop policy if exists "Allow all access to motivational messages" on public.mensagens_motivacionais;

create policy "Authenticated full access to mensagens_motivacionais"
  on public.mensagens_motivacionais
  to authenticated
  using (true)
  with check (true);

-- 6) Lock down mensagens_templates
alter table public.mensagens_templates enable row level security;
drop policy if exists "Allow all access to message templates" on public.mensagens_templates;

create policy "Authenticated full access to mensagens_templates"
  on public.mensagens_templates
  to authenticated
  using (true)
  with check (true);

-- 7) Lock down motivos_cancelamento
alter table public.motivos_cancelamento enable row level security;
drop policy if exists "Allow all access to cancellation reasons" on public.motivos_cancelamento;

create policy "Authenticated full access to motivos_cancelamento"
  on public.motivos_cancelamento
  to authenticated
  using (true)
  with check (true);

-- 8) Lock down ultima_mensagem_vista
alter table public.ultima_mensagem_vista enable row level security;
drop policy if exists "Allow all access to last viewed message" on public.ultima_mensagem_vista;

create policy "Authenticated full access to ultima_mensagem_vista"
  on public.ultima_mensagem_vista
  to authenticated
  using (true)
  with check (true);

-- 9) Normalize clientes policies (already authenticated-only but has duplicates)
alter table public.clientes enable row level security;

drop policy if exists "Allow authenticated inserts" on public.clientes;
drop policy if exists "Usuários autenticados podem atualizar clientes" on public.clientes;
drop policy if exists "Usuários autenticados podem excluir clientes" on public.clientes;
drop policy if exists "Usuários autenticados podem inserir clientes" on public.clientes;
drop policy if exists "Usuários autenticados podem ver todos os clientes" on public.clientes;

create policy "Authenticated can select clientes"
  on public.clientes for select
  to authenticated
  using (true);

create policy "Authenticated can insert clientes"
  on public.clientes for insert
  to authenticated
  with check (true);

create policy "Authenticated can update clientes"
  on public.clientes for update
  to authenticated
  using (true);

create policy "Authenticated can delete clientes"
  on public.clientes for delete
  to authenticated
  using (true);
