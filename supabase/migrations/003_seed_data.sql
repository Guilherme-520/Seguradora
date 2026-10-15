-- =============================================================
-- Migration 003: Dados fictícios (seed)
-- =============================================================

-- Nota: os usuários de auth.users precisam ser criados via Supabase Auth.
-- Este seed insere chamados com assignee_name fixo (sem FK para auth.users)
-- para permitir execução independente.

-- Reinicia a sequência para seed previsível
alter sequence ticket_protocol_seq restart with 1;

insert into public.tickets (
  protocol, requester_name, requester_email, requester_phone,
  policy_number, title, description, category, priority,
  status, assignee_name, created_at, updated_at
) values
(
  'SEG-20240101-00001',
  'Maria Silva',
  'maria.silva@email.com',
  '11999990001',
  'APL-2024-001234',
  'Solicitação de reembolso de sinistro',
  'Meu veículo foi danificado em um acidente no dia 28/12/2023. Preciso de orientações sobre o processo de reembolso e quais documentos devo enviar.',
  'sinistro',
  'alta',
  'em_atendimento',
  'Carlos Mendes',
  now() - interval '5 days',
  now() - interval '2 days'
),
(
  'SEG-20240102-00002',
  'João Pereira',
  'joao.pereira@email.com',
  '21988880002',
  'APL-2023-005678',
  'Dúvida sobre cobertura de assistência 24h',
  'Gostaria de saber se minha apólice inclui assistência 24 horas para situações de pane seca e reboque.',
  'duvida',
  'baixa',
  'aberto',
  null,
  now() - interval '3 days',
  now() - interval '3 days'
),
(
  'SEG-20240103-00003',
  'Ana Souza',
  'ana.souza@email.com',
  '31977770003',
  null,
  'Reclamação sobre demora no atendimento',
  'Liguei três vezes esta semana e não consegui resolver meu problema. O atendimento está muito lento e preciso de uma resposta urgente sobre meu processo.',
  'reclamacao',
  'critica',
  'aguardando_cliente',
  'Fernanda Lima',
  now() - interval '7 days',
  now() - interval '1 day'
),
(
  'SEG-20240104-00004',
  'Roberto Costa',
  'roberto.costa@email.com',
  '41966660004',
  'APL-2024-009012',
  'Solicitação de cancelamento de apólice',
  'Quero cancelar minha apólice de seguro residencial com número APL-2024-009012 a partir de 01/02/2024. Preciso saber o valor do estorno proporcional.',
  'cancelamento',
  'media',
  'resolvido',
  'Carlos Mendes',
  now() - interval '10 days',
  now() - interval '4 hours'
),
(
  'SEG-20240105-00005',
  'Lucia Ferreira',
  'lucia.ferreira@email.com',
  '51955550005',
  'APL-2023-007890',
  'Atualização de dados cadastrais',
  'Preciso atualizar meu endereço e número de telefone no cadastro da apólice APL-2023-007890.',
  'apolice',
  'baixa',
  'encerrado',
  'Amanda Torres',
  now() - interval '15 days',
  now() - interval '2 days'
),
(
  'SEG-20240106-00006',
  'Pedro Alves',
  'pedro.alves@email.com',
  '61944440006',
  'APL-2024-003456',
  'Cobrança indevida na fatura',
  'Identifiquei uma cobrança de R$ 250,00 indevida na minha última fatura referente ao mês de dezembro. Solicito análise e estorno.',
  'cobranca',
  'alta',
  'aberto',
  null,
  now() - interval '1 day',
  now() - interval '1 day'
),
(
  'SEG-20240107-00007',
  'Carla Martins',
  'carla.martins@email.com',
  '71933330007',
  'APL-2022-011111',
  'Renovação de apólice com desconto',
  'Minha apólice vence em 15/02/2024. Gostaria de renovar e entender quais descontos estão disponíveis para clientes com histórico limpo.',
  'apolice',
  'media',
  'em_atendimento',
  'Fernanda Lima',
  now() - interval '4 days',
  now() - interval '12 hours'
),
(
  'SEG-20240108-00008',
  'Marcos Oliveira',
  'marcos.oliveira@email.com',
  '81922220008',
  null,
  'Sinistro: alagamento residencial',
  'Minha residência foi alagada devido às chuvas do último fim de semana. Preciso acionar o seguro residencial e saber quais os próximos passos.',
  'sinistro',
  'critica',
  'aberto',
  null,
  now() - interval '6 hours',
  now() - interval '6 hours'
);

-- Interações dos chamados
insert into public.ticket_interactions (ticket_id, origin, author_name, content, created_at)
select
  t.id,
  'agente',
  'Agente WXO',
  'Chamado aberto automaticamente pelo agente de atendimento. Protocolo gerado: ' || t.protocol,
  t.created_at
from public.tickets t;

-- Interações adicionais para chamados em andamento
insert into public.ticket_interactions (ticket_id, origin, author_name, content, created_at)
select t.id, 'usuario', 'Carlos Mendes',
  'Chamado recebido. Estamos analisando a documentação enviada e retornaremos em até 2 dias úteis.',
  t.created_at + interval '2 hours'
from public.tickets t where t.protocol = 'SEG-20240101-00001';

insert into public.ticket_interactions (ticket_id, origin, author_name, content, created_at)
select t.id, 'agente', 'Agente WXO',
  'Cliente confirma que os documentos foram enviados por e-mail. Aguardando análise da equipe.',
  t.created_at + interval '1 day'
from public.tickets t where t.protocol = 'SEG-20240101-00001';

insert into public.ticket_interactions (ticket_id, origin, author_name, content, created_at)
select t.id, 'usuario', 'Fernanda Lima',
  'Solicitamos documentação complementar ao cliente: boletim de ocorrência e fotos do veículo.',
  t.created_at + interval '3 days'
from public.tickets t where t.protocol = 'SEG-20240103-00003';

insert into public.ticket_interactions (ticket_id, origin, author_name, content, created_at)
select t.id, 'usuario', 'Carlos Mendes',
  'Cancelamento processado. Estorno de R$ 342,50 será creditado em até 5 dias úteis no cartão cadastrado.',
  t.updated_at - interval '30 minutes'
from public.tickets t where t.protocol = 'SEG-20240104-00004';

-- Histórico de alterações
insert into public.ticket_history (ticket_id, origin, author_name, field_name, old_value, new_value, changed_at)
select t.id, 'usuario', 'Carlos Mendes', 'status', 'aberto', 'em_atendimento', t.created_at + interval '3 hours'
from public.tickets t where t.protocol = 'SEG-20240101-00001';

insert into public.ticket_history (ticket_id, origin, author_name, field_name, old_value, new_value, changed_at)
select t.id, 'usuario', 'Carlos Mendes', 'assignee', null, 'Carlos Mendes', t.created_at + interval '3 hours'
from public.tickets t where t.protocol = 'SEG-20240101-00001';

insert into public.ticket_history (ticket_id, origin, author_name, field_name, old_value, new_value, changed_at)
select t.id, 'usuario', 'Fernanda Lima', 'status', 'aberto', 'aguardando_cliente', t.created_at + interval '6 hours'
from public.tickets t where t.protocol = 'SEG-20240103-00003';

insert into public.ticket_history (ticket_id, origin, author_name, field_name, old_value, new_value, changed_at)
select t.id, 'usuario', 'Carlos Mendes', 'status', 'em_atendimento', 'resolvido', t.updated_at - interval '1 hour'
from public.tickets t where t.protocol = 'SEG-20240104-00004';

insert into public.ticket_history (ticket_id, origin, author_name, field_name, old_value, new_value, changed_at)
select t.id, 'usuario', 'Amanda Torres', 'status', 'resolvido', 'encerrado', t.updated_at
from public.tickets t where t.protocol = 'SEG-20240105-00005';
