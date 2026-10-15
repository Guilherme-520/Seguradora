-- =============================================================
-- Migration 002: Row Level Security (RLS)
-- =============================================================

-- RLS em tickets: apenas usuários autenticados lêem/escrevem
alter table public.tickets enable row level security;
alter table public.ticket_interactions enable row level security;
alter table public.ticket_history enable row level security;

-- Política: usuário autenticado pode ler todos os tickets
create policy "Authenticated users can read tickets"
  on public.tickets for select
  using (auth.role() = 'authenticated');

-- Política: usuário autenticado pode inserir tickets
create policy "Authenticated users can insert tickets"
  on public.tickets for insert
  with check (auth.role() = 'authenticated');

-- Política: usuário autenticado pode atualizar tickets
create policy "Authenticated users can update tickets"
  on public.tickets for update
  using (auth.role() = 'authenticated');

-- Política: apenas service_role pode deletar (não exposto no frontend)
create policy "Service role can delete tickets"
  on public.tickets for delete
  using (auth.role() = 'service_role');

-- Interações
create policy "Authenticated users can read interactions"
  on public.ticket_interactions for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert interactions"
  on public.ticket_interactions for insert
  with check (auth.role() = 'authenticated');

-- Histórico (somente leitura para autenticados, escrita via service_role)
create policy "Authenticated users can read history"
  on public.ticket_history for select
  using (auth.role() = 'authenticated');

create policy "Service role can insert history"
  on public.ticket_history for insert
  with check (auth.role() = 'service_role' or auth.role() = 'authenticated');
