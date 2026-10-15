-- Migration 004: Adiciona campo CPF ao ticket
alter table public.tickets
  add column requester_cpf text;

-- Índice para busca por CPF
create index idx_tickets_cpf on public.tickets(requester_cpf);
