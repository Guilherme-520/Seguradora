-- =============================================================
-- Migration 001: Schema inicial do sistema de chamados
-- =============================================================

-- Extensão para UUID
create extension if not exists "pgcrypto";

-- =============================================================
-- ENUM types
-- =============================================================

create type ticket_status as enum (
  'aberto',
  'em_atendimento',
  'aguardando_cliente',
  'resolvido',
  'encerrado'
);

create type ticket_priority as enum (
  'baixa',
  'media',
  'alta',
  'critica'
);

create type ticket_category as enum (
  'sinistro',
  'apolice',
  'cobranca',
  'cancelamento',
  'duvida',
  'reclamacao',
  'outro'
);

create type interaction_origin as enum (
  'agente',
  'usuario'
);

-- =============================================================
-- Tabela: tickets (chamados)
-- =============================================================

create table public.tickets (
  id              uuid primary key default gen_random_uuid(),
  protocol        text not null unique,
  -- Solicitante
  requester_name  text not null,
  requester_email text,
  requester_phone text,
  policy_number   text,
  -- Conteúdo
  title           text not null,
  description     text not null,
  category        ticket_category not null default 'outro',
  priority        ticket_priority not null default 'media',
  -- Gestão
  status          ticket_status not null default 'aberto',
  assignee_id     uuid references auth.users(id) on delete set null,
  assignee_name   text,
  -- Idempotência: hash do conteúdo para evitar duplicação pelo agente
  idempotency_key text unique,
  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  closed_at       timestamptz
);

-- =============================================================
-- Tabela: ticket_interactions (interações e comentários)
-- =============================================================

create table public.ticket_interactions (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  origin      interaction_origin not null default 'usuario',
  author_name text not null,
  author_id   uuid,           -- null quando origin = 'agente'
  content     text not null,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- Tabela: ticket_history (histórico de alterações de campos)
-- =============================================================

create table public.ticket_history (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  origin      interaction_origin not null default 'usuario',
  author_name text not null,
  author_id   uuid,
  field_name  text not null,
  old_value   text,
  new_value   text,
  changed_at  timestamptz not null default now()
);

-- =============================================================
-- Índices
-- =============================================================

create index idx_tickets_status    on public.tickets(status);
create index idx_tickets_priority  on public.tickets(priority);
create index idx_tickets_category  on public.tickets(category);
create index idx_tickets_assignee  on public.tickets(assignee_id);
create index idx_tickets_created   on public.tickets(created_at desc);
create index idx_tickets_protocol  on public.tickets(protocol);

create index idx_interactions_ticket on public.ticket_interactions(ticket_id);
create index idx_interactions_created on public.ticket_interactions(created_at desc);

create index idx_history_ticket on public.ticket_history(ticket_id);
create index idx_history_changed on public.ticket_history(changed_at desc);

-- =============================================================
-- Trigger: atualiza updated_at automaticamente
-- =============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- Nota: o histórico de alterações (ticket_history) é gravado diretamente
-- pelo backend (controllers/tickets.js) com o nome real do autor.
-- O trigger foi removido para evitar duplicação de entradas.

-- =============================================================
-- Função: gera protocolo único no formato SEG-YYYYMMDD-NNNNN
-- =============================================================

create sequence if not exists ticket_protocol_seq start 1;

create or replace function public.generate_protocol()
returns text language plpgsql as $$
declare
  v_date text := to_char(now(), 'YYYYMMDD');
  v_seq  int  := nextval('ticket_protocol_seq');
begin
  return 'SEG-' || v_date || '-' || lpad(v_seq::text, 5, '0');
end;
$$;
