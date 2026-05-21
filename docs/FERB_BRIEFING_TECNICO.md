# FERB — BRIEFING TÉCNICO PARA EQUIPE DE DESENVOLVIMENTO

**Cliente:** EHXIS
**Projeto:** FERB — Plataforma de Inteligência Estratégica para Artistas Musicais
**Tipo:** SaaS B2B (com versão personalizada para KYAN)
**Versão deste documento:** 1.0
**Data:** Maio 2026

> Documento de planejamento fornecido pelo cliente. Salvo aqui como referência
> mestra do roadmap. Estado atual de implementação ao fim do arquivo.

---

## 1. CONTEXTO E VISÃO

### 1.1 O que é o FERB

FERB é uma plataforma SaaS que funciona como um "cérebro de gravadora automatizado por IA". Não é dashboard. Não é Spotify for Artists. Não é Chartmetric.

É a fusão de:
- Spotify for Artists (dados)
- Chartmetric (inteligência de mercado)
- A&R de gravadora major (curadoria)
- Agência de marketing (execução)
- Consultor internacional (expansão)
- Career coach (estratégia)

Tudo isso automatizado por agentes de IA especializados.

### 1.2 Por que existe

Artistas independentes e gravadoras médias não têm acesso à inteligência que uma major label tem (com 100+ funcionários analisando dados manualmente). FERB democratiza isso.

### 1.3 Diferencial competitivo

**Não é mais um dashboard.** Concorrentes (Chartmetric, Soundcharts, Viberate) mostram dados. FERB **interpreta, decide e age** através de 9 agentes especialistas que conversam entre si.

---

## 2. ESCOPO E ENTREGÁVEIS

### 2.1 O que JÁ existe (Fase 0 — Concluída)

- Backend Node.js + Express
- Frontend React + Vite (não Next.js — decisão da Fase 0)
- Integração base Chartmetric API
- Integração Claude API
- Job cron diário (6:30 AM)
- Abas funcionais: Home, Audiência, Relações, Execução
- Sistema de design Apple Music dark
- Logo EHXIS (10 variações)

### 2.2 Fases 1 a 4

#### FASE 1 — Multi-Agente MVP (3 semanas)
- Sistema de 9 agentes especialistas
- Conversação 1-on-1 (chat com cada agente)
- Sistema de Demandas (você pede, agente entrega)
- Discussões entre agentes ("Concílio")
- Mapa regional do Brasil (SVG interativo)

#### FASE 2 — Inteligência Profunda (4 semanas)
- DNA Musical (audio features + análise de padrões)
- Playlist Intelligence (curadores, conexões, viralização)
- Radar Internacional (potencial por país)
- Social Listening v1 (sentiment, narrativas)

#### FASE 3 — Career AI + Trend Prediction (4 semanas)
- Agente estratégico de carreira (longo prazo)
- Trend prediction (detectar micro-tendências)
- Predição de viralização
- Comparação com concorrentes

#### FASE 4 — Escalabilidade SaaS (3 semanas)
- Multi-tenancy (várias gravadoras)
- Sistema de billing (Stripe)
- White-label para agências
- API pública

**TOTAL: 14 semanas com equipe de 3-5 pessoas**

---

## 3. STACK TÉCNICA

### 3.1 Decisões já tomadas

Frontend: React 18 + Vite, TypeScript, TailwindCSS + shadcn/ui, Framer Motion.
Backend: Node.js + Express, Prisma ORM + PostgreSQL, Redis + BullMQ.
IA: Claude API (principal), OpenAI (fallback + embeddings), Pinecone/Supabase Vector (RAG).
Infra: Docker, DigitalOcean App Platform, Cloudflare, Sentry, PostHog.

### 3.2 Migração necessária
1. TypeScript no frontend (gradual)
2. Tailwind no frontend (gradual)
3. Redis + BullMQ no backend
4. Sentry + PostHog (observability)

### 3.3 Por que NÃO Next.js / FastAPI
React + Vite já funciona; Node + Express é suficiente; time experiente em Node; Claude SDK Node maduro.

---

## 4. EQUIPE

1 Tech Lead full-stack senior, 1 Backend pleno-sênior, 1 Frontend pleno-sênior,
1 AI/ML Engineer pleno, 1 Designer meio-período. Opcional: Data Engineer, DevOps.

Modelo: Sprints de 2 semanas, daily 15min, code review obrigatório.
Ferramentas: Slack/Discord, Linear/ClickUp, GitHub, GitHub Actions, Notion, Figma.

---

## 5. ROADMAP RESUMIDO

- **Sprint 1-2:** Infra + 9 agentes base + demandas
- **Sprint 3:** Discussões entre agentes + mapa regional
- **Sprint 3-4:** DNA Musical + Playlist Intelligence
- **Sprint 4:** Radar Internacional + Social Listening
- **Sprint 5:** Career AI (agente master)
- **Sprint 6:** Trend Prediction (ML)
- **Sprint 7:** Multi-tenancy + Billing Stripe
- **Sprint 8:** White-label + API pública

---

## 6. PADRÕES TÉCNICOS

- ESLint + Prettier, Husky pre-commit, Conventional Commits
- Toda mudança de banco via Prisma migration, soft delete, audit log
- REST versionado (/api/v1/), resposta { data, error, meta }, validação Zod
- Prompts versionados, temperature explícita, retry com backoff, fallback OpenAI
- Segredos no .env/vault, JWT com refresh, CORS whitelist, Helmet, Prisma sempre

---

## 7. INTEGRAÇÕES

| API | Plano | Notas |
|-----|-------|-------|
| Chartmetric | Business ($800/mês) | 60 req/min, cache 6-24h |
| Spotify Web API | Free (planejado) | ATENÇÃO: hoje exige Premium — ver estado atual |
| Claude API | Pago | ~$1.150/mês estimado em 1000 usuários |
| OpenAI (embeddings) | Pago | text-embedding-3-small |
| YouTube Data API | Free | 10k units/dia |

---

## 8. ORÇAMENTO

- Desenvolvimento (14 semanas): R$ 245.000
- Infra mensal: $1.500-3.000
- ROI meta: R$ 30k MRR em 6 meses, R$ 100k+ em 12 meses

---

## 9. KPIs

Técnico: uptime >99.5%, latência P95 <500ms, resposta de agente <5s, cobertura >70%.
Produto: 100 usuários em 6 meses, DAU/MAU >30%, NPS >50, churn <5%.
Negócio: MRR R$30k/6m, R$100k/12m, LTV/CAC >10x.

---

## ESTADO ATUAL DE IMPLEMENTAÇÃO (atualizado 2026-05-20)

Construído nas sessões com Claude Code (fora da equipe do briefing):

### Concluído
- 9 agentes funcionais (in-memory, SEM Prisma ainda) — Fase 1 parcial
- Conversação 1-on-1 via demandas (POST /api/mvp/demand/:agentId)
- Briefing por agente: resumo + sugestão proativa ancorada em dados reais
- Contexto real do KYAN injetado por agente (agentContext.js)
- Home com 13 blocos de dados Chartmetric reais
- Persona FERB artística (mestre artista, não executivo)
- Chartmetric expandido: identity, cidades, países, albums, playlists, related, fanmetrics
- Spotify service implementado (Client Credentials) — BLOQUEADO por exigência Premium
- YouTube service implementado — aguardando API key
- Instagram service unificado (Chartmetric + Firecrawl + Graph opcional)

### Divergências do briefing (decisões da implementação real)
- Frontend foi para TanStack Router + TS + Tailwind v4 + shadcn/ui (briefing dizia React+Vite simples)
- Sem Prisma/PostgreSQL ainda — agentes e demandas são in-memory (perdem no restart)
- Sem Redis/BullMQ ainda
- Mapa regional: dados REAIS já (não mock como o briefing sugeria pro Sprint 2)

### Pendente do roadmap
- Migrar agentes/demandas para Prisma + PostgreSQL (persistência)
- Discussões entre agentes ("Concílio") — Sprint 2
- Mapa SVG interativo do Brasil — Sprint 2
- DNA Musical, Playlist Intelligence — Fase 2
- Radar Internacional, Social Listening — Fase 2
- Career AI master, Trend Prediction — Fase 3
- Multi-tenancy, billing, white-label — Fase 4
