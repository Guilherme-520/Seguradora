# 🛡️ Seguradora — Central de Chamados

Sistema fullstack para gerenciamento de chamados de atendimento de uma seguradora, integrado ao **IBM watsonx Orchestrate** e ao **Supabase**.

---

## Sumário

1. [Visão geral da arquitetura](#arquitetura)
2. [Stack escolhida](#stack)
3. [Estrutura do projeto](#estrutura)
4. [Pré-requisitos](#pre-requisitos)
5. [Configuração do Supabase](#supabase)
6. [Variáveis de ambiente](#env)
7. [Rodando localmente](#local)
8. [Rodando com Docker](#docker)
9. [Integração com watsonx Orchestrate](#orchestrate)
10. [Validação do fluxo completo](#validacao)
11. [Referência da API](#api-ref)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                  IBM watsonx Orchestrate                │
│  Agente usa ferramentas OpenAPI → chama /api/agent/*    │
└──────────────────────────┬──────────────────────────────┘
                           │ X-API-Key (ORCHESTRATE_API_KEY)
                           ▼
┌──────────────────────────────────────────────────────────┐
│                     Backend (Node/Express)               │
│  /api/agent/*  — rotas do agente                        │
│  /api/tickets  — rotas do frontend (JWT Bearer)         │
│  /api/auth/*   — login/logout                           │
└────────────────────────┬─────────────────────────────────┘
                         │ service_role key (admin) ou JWT
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + Auth + RLS)         │
│  tickets · ticket_interactions · ticket_history         │
└──────────────────────────────────────────────────────────┘
                         ▲
                         │ JWT Bearer (Supabase Auth)
┌──────────────────────────────────────────────────────────┐
│                Frontend (React + Vite + Tailwind)        │
│  Login · Painel · Lista de chamados · Detalhes          │
└──────────────────────────────────────────────────────────┘
```

## Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Backend | Node.js 20 + Express | Leve, sem compilação, bom suporte ao SDK Supabase |
| Frontend | React 18 + Vite + Tailwind | Build rápido, SPA responsiva, sem framework pesado |
| Banco de dados | Supabase (PostgreSQL) | Auth gerenciado, RLS nativo, REST e SDK prontos |
| Hospedagem | Vercel | Site estático + API serverless no mesmo domínio |
| Container | Docker + Compose | Alternativa para rodar localmente/self-hosted |
| Proxy SPA | Nginx | Serve arquivos estáticos + roteamento SPA |

---

## Estrutura

```
seguradoraWXO/
├── backend/
│   ├── src/
│   │   ├── app.js                # App Express (usado pelo Vercel e local)
│   │   ├── index.js              # Servidor local / Docker (app.listen)
│   │   ├── routes/index.js       # Todas as rotas
│   │   ├── middleware/auth.js    # requireAuth + requireOrchestrateKey
│   │   ├── controllers/
│   │   │   ├── tickets.js        # CRUD de chamados
│   │   │   ├── auth.js           # Login/logout/me
│   │   │   └── dashboard.js      # Estatísticas
│   │   └── lib/supabase.js       # Clients admin + public
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Roteamento
│   │   ├── contexts/AuthContext  # Estado de autenticação
│   │   ├── services/api.js       # HTTP client
│   │   ├── pages/
│   │   │   ├── LoginPage
│   │   │   ├── DashboardPage     # KPIs + gráficos + recentes
│   │   │   ├── TicketsPage       # Lista + filtros + paginação
│   │   │   └── TicketDetailPage  # Detalhes + histórico + gestão
│   │   ├── components/           # Layout, Badges, UI
│   │   └── utils/ticketUtils.js  # Labels e formatadores
│   ├── Dockerfile
│   └── package.json
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql   # Tabelas, triggers, funções
│       ├── 002_rls_policies.sql     # Row Level Security
│       └── 003_seed_data.sql        # 8 chamados fictícios
├── api/index.js                  # Função serverless do Vercel (expõe o Express)
├── vercel.json                   # Build, função e rewrites do Vercel
├── package.json                  # npm workspaces (backend + frontend)
├── openapi.yaml                  # Spec para importação no Orchestrate
├── docker-compose.yml
└── .env.example
```

---

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose (para deploy containerizado)
- Conta no [Supabase](https://supabase.com) — projeto **WXO** já criado
- Acesso ao IBM watsonx Orchestrate (para integração do agente)

---

## Configuração do Supabase

### 1. Obter as chaves do projeto

No [Dashboard do Supabase](https://supabase.com/dashboard/project/krpkzigbggjlrklcwxeo):

1. Acesse **Settings → API**
2. Copie:
   - **Project URL**: `https://krpkzigbggjlrklcwxeo.supabase.co`
   - **anon / public**: → `SUPABASE_PUBLISHABLE_KEY`
   - **service_role** (⚠️ nunca exponha): → `SUPABASE_SECRET_KEY`

### 2. Executar as migrações SQL

No **SQL Editor** do Supabase, execute os arquivos na ordem:

```sql
-- 1. Schema inicial (tabelas, triggers, funções)
-- Conteúdo de: supabase/migrations/001_initial_schema.sql

-- 2. Políticas RLS
-- Conteúdo de: supabase/migrations/002_rls_policies.sql

-- 3. Dados fictícios (opcional — dev/demo)
-- Conteúdo de: supabase/migrations/003_seed_data.sql
```

> **Dica**: copie o conteúdo de cada arquivo e cole no SQL Editor, executando um por vez.

### 3. Criar usuários da equipe

No Supabase Dashboard → **Authentication → Users → Add user**:

| Email | Senha sugerida | Nome |
|---|---|---|
| carlos.mendes@seguradora.com | Seguradora@123 | Carlos Mendes |
| fernanda.lima@seguradora.com | Seguradora@123 | Fernanda Lima |
| amanda.torres@seguradora.com | Seguradora@123 | Amanda Torres |

Ou via SQL (substitua as senhas):

```sql
-- Executa no SQL Editor do Supabase
SELECT auth.create_user(
  '{"email": "carlos.mendes@seguradora.com", "password": "Seguradora@123", "email_confirm": true}'::jsonb
);
```

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

```env
# Supabase
SUPABASE_URL=https://krpkzigbggjlrklcwxeo.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon key>
SUPABASE_SECRET_KEY=<service_role key>

# Chave para o agente do Orchestrate
ORCHESTRATE_API_KEY=minha-chave-super-secreta-32chars+

# Backend
PORT=3001
CORS_ORIGINS=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3001/api
```

---

## Rodando localmente

### Backend

```bash
cd backend
npm install
# Crie um arquivo .env com as variáveis (ou copie da raiz)
cp ../.env .env
npm run dev
# → Backend rodando em http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
# Crie um arquivo .env com VITE_API_URL
echo "VITE_API_URL=http://localhost:3001/api" > .env
npm run dev
# → Frontend em http://localhost:5173
```

---

## Rodando com Docker

```bash
# Na raiz do projeto
cp .env.example .env
# Edite .env com suas credenciais reais

docker compose up --build
```

| Serviço | URL local |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |
| Health check | http://localhost:3001/health |

---

## Deploy no Vercel

Frontend e API sobem como **um único projeto Vercel**: o build do Vite é servido
como site estático e o Express roda como função serverless em `api/index.js`
(todas as rotas `/api/*` são reescritas para ela — ver `vercel.json`). Como os dois
ficam no mesmo domínio, não é preciso configurar CORS nem `VITE_API_URL`.

1. Suba o repositório para o GitHub (o `.gitignore` já exclui os arquivos `.env`).
2. No Vercel: **Add New → Project** e importe o repositório.
   - **Root Directory**: a raiz do repositório (não `frontend/`)
   - Framework, build e output já vêm do `vercel.json`
3. Em **Settings → Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | anon key |
| `SUPABASE_SECRET_KEY` | service_role key (só no servidor) |
| `ORCHESTRATE_API_KEY` | chave longa e aleatória (ex.: `openssl rand -hex 32`) |

4. Faça o deploy e teste: `https://<seu-projeto>.vercel.app/api/health`

> As *Deployment Protection* do Vercel (Vercel Authentication) bloqueiam chamadas
> externas nos deploys de preview. Use o domínio de produção no Orchestrate.

---

## Integração com watsonx Orchestrate

### 1. Obter o spec com a URL certa

O deploy serve o spec já com o servidor apontando para ele mesmo:

```bash
curl -o openapi.yaml https://<seu-projeto>.vercel.app/api/openapi.yaml
```

(ou edite `servers[0].url` no `openapi.yaml` do repositório).

### 2. Importar as ferramentas

1. No Orchestrate: **Manage agents → (seu agente) → Toolset → Add tool → OpenAPI**
2. Faça upload do `openapi.yaml` e selecione as operações abaixo
3. Na conexão, escolha autenticação **API Key** — header `X-API-Key`, valor igual
   ao `ORCHESTRATE_API_KEY` do Vercel

| operationId | Quando o agente usa |
|---|---|
| `criarChamado` | Cliente relata problema/solicitação — devolve o protocolo |
| `consultarChamado` | Cliente pergunta o andamento de um protocolo |
| `listarChamados` | Buscar chamados do cliente (CPF, nome) ou por status/prioridade |
| `atualizarChamado` | Mudar status, prioridade ou responsável |
| `adicionarInteracao` | Registrar uma informação nova no chamado |

A origem das alterações é definida pela autenticação: tudo que entra pela
`X-API-Key` fica registrado como **agente**, tudo que vem do painel como **usuário**.

### 3. Instruções sugeridas para o agente

```
Você é o assistente de atendimento da seguradora.
- Para abrir um chamado, colete nome, CPF e uma descrição do problema; classifique
  a categoria e a prioridade (sinistros com risco ou urgência = alta/critica) e use
  criarChamado. Sempre informe o protocolo ao cliente.
- Para consultar, peça o protocolo e use consultarChamado. Sem protocolo, use
  listarChamados com o CPF do cliente.
- Novas informações do cliente sobre um chamado existente vão em adicionarInteracao.
- Explique o status em linguagem simples (ex.: aguardando_cliente = estamos
  aguardando um retorno seu).
```

---

## Validação do fluxo completo

### Passo 1 — Criar chamado via API (simula o agente)

```bash
curl -X POST https://<seu-projeto>.vercel.app/api/agent/tickets \
  -H "Content-Type: application/json" \
  -H "X-API-Key: minha-chave-super-secreta-32chars+" \
  -d '{
    "requester_name": "João Teste",
    "requester_email": "joao@teste.com",
    "title": "Teste de integração",
    "description": "Validando o fluxo completo do sistema.",
    "category": "duvida",
    "priority": "baixa"
  }'
```

Resposta esperada:
```json
{
  "message": "Chamado criado com sucesso",
  "ticket": {
    "protocol": "SEG-20240115-00001",
    "status": "aberto",
    ...
  }
}
```

### Passo 2 — Verificar no frontend

1. Acesse http://localhost:5173
2. Faça login com um usuário cadastrado
3. Vá em **Chamados** — o chamado `SEG-20240115-00001` deve aparecer
4. Clique no protocolo para ver os detalhes

### Passo 3 — Atualizar status no frontend

1. Na tela de detalhes, altere o **Status** para `Em atendimento`
2. Preencha o **Responsável**
3. Clique em **Salvar alterações**

### Passo 4 — Consultar o status atualizado via API

```bash
curl https://<seu-projeto>.vercel.app/api/agent/tickets/SEG-20240115-00001 \
  -H "X-API-Key: minha-chave-super-secreta-32chars+"
```

Resposta esperada:
```json
{
  "ticket": {
    "protocol": "SEG-20240115-00001",
    "status": "em_atendimento",
    ...
  },
  "history": [
    {
      "field_name": "status",
      "old_value": "aberto",
      "new_value": "em_atendimento",
      ...
    }
  ]
}
```

### Passo 5 — Testar idempotência

Reenvie a mesma requisição do Passo 1. A resposta será `200` (não `201`) com o chamado já existente — sem duplicação.

---

## Referência da API

Utilitárias: `GET /api/health` e `GET /api/openapi.yaml`.

### Rotas do agente (`/api/agent/*`)

Autenticação: `X-API-Key: <ORCHESTRATE_API_KEY>`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/agent/tickets` | Criar chamado |
| GET | `/api/agent/tickets` | Listar (com filtros) |
| GET | `/api/agent/tickets/:protocol` | Consultar por protocolo |
| PATCH | `/api/agent/tickets/:protocol` | Atualizar status/responsável |
| POST | `/api/agent/tickets/:protocol/interactions` | Adicionar interação |

### Rotas do frontend (`/api/*`)

Autenticação: `Authorization: Bearer <JWT Supabase>`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Dados do usuário |
| GET | `/api/dashboard/stats` | Estatísticas do painel |
| POST | `/api/tickets` | Criar chamado pelo painel |
| GET | `/api/tickets` | Listar chamados |
| GET | `/api/tickets/:protocol` | Detalhes por protocolo |
| GET | `/api/tickets/id/:id` | Detalhes por ID |
| PATCH | `/api/tickets/:protocol` | Atualizar chamado |
| POST | `/api/tickets/:protocol/interactions` | Adicionar interação |

### Parâmetros de listagem (`GET /api/tickets`)

| Parâmetro | Tipo | Valores |
|---|---|---|
| `status` | string | `aberto`, `em_atendimento`, `aguardando_cliente`, `resolvido`, `encerrado` |
| `priority` | string | `baixa`, `media`, `alta`, `critica` |
| `category` | string | `sinistro`, `apolice`, `cobranca`, `cancelamento`, `duvida`, `reclamacao`, `outro` |
| `requester_cpf` | string | CPF exato do cliente (com ou sem pontuação) |
| `search` | string | Busca por nome, título, protocolo, apólice ou CPF |
| `page` | integer | Padrão: 1 |
| `limit` | integer | Padrão: 20, máx: 100 |

---

## Segurança

- **SUPABASE_SECRET_KEY**: nunca incluída no frontend; usada exclusivamente no backend
- **ORCHESTRATE_API_KEY**: valida todas as chamadas do agente antes de qualquer operação
- **RLS**: garante que apenas usuários autenticados acessem os dados via Supabase direto
- **Helmet**: headers de segurança HTTP no backend
- **CORS**: configurável por variável de ambiente

---

*Sistema desenvolvido para a prova de conceito de integração entre IBM watsonx Orchestrate e Supabase.*
