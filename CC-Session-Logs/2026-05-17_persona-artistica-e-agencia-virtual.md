# Sessão: 17-05-2026 - FERB persona artística + Agência Virtual MVP

## Referência Rápida

**Tópicos:** persona Claude (mestre artista vs executivo), MVP Agência Virtual Habbo-style, in-memory storage, TanStack Router, debugging port conflicts, prompt engineering para stripping markdown

**Projetos:** FERB (sistema operacional artístico do KYAN)

**Resultado:** 
- Persona do FERB reescrita: de executivo cobrador → mestre artista que aponta direção
- Agência Virtual MVP implementada: 9 agentes com salas, demandas e respostas via Claude na voz de cada um
- Sistema 100% testado e funcionando (curl + UI)
- 3 commits pushed para `worldfromhands/ferb`

---

## Decisões Tomadas

### Persona artística do FERB
- Persona reescrita em `backend/src/agents/ferbPersona.js`: deixou de ser "cobra quando precisa cobrar" → agora é "mestre artista que lê dados como quem lê uma obra"
- Toda análise aponta **direção**, não condenação
- Última frase sempre sugere um movimento possível
- UI alinhada: "Crítico hoje" → "Pontos de tensão", "FERB acha que" → "Leitura do momento", AlertTriangle → Eye icon

### Agência Virtual MVP
- **Sem Prisma** — usar in-memory Maps (Map agentId → demand[]) para MVP
- **Sem Pixi.js/Canvas** — pure React/CSS, cards + grid
- **TanStack Router** (não tabs/App.jsx do MVP original) — rota `/agencia`
- **9 agentes hardcoded** no backend com avatar emoji, cor, room name
- **Poll de 2s** no frontend para atualizar moods e status de demandas em tempo real
- **Delay 4-8s** entre "in_progress" → "completed" para simular trabalho do agente
- Cada agente tem **prompt próprio** em `backend/src/agents/agentPrompts.js`

### Stripping de markdown
- Instrução só no system prompt **não basta** — Claude ainda gera `**bold**` ocasional
- Solução: **reforço duplo** (system prompt + user prompt) com regra explícita "FORMATO OBRIGATÓRIO: texto corrido, sem asteriscos, sem negrito, sem emojis"

---

## Principais Aprendizados

### Preview tool vs porta do .env
- O preview tool do Claude Code seta `PORT` env var pelo `launch.json`, ignorando o `.env` (PORT=3333)
- Backend acaba rodando em **3000** quando spawned via preview, e em **3333** quando rodado direto via npm
- Vite proxy precisa apontar para 3000 (porta efetiva), não 3333
- Quando dois node processes coexistem (um na 3000 antigo, outro na 3333 novo), o frontend continua hitting o antigo

### Workaround: kill all node + start manual
```powershell
Get-Process -Name 'node' -ErrorAction SilentlyContinue | Stop-Process -Force
```
Depois:
```bash
cd backend && PORT=3000 node src/index.js > /tmp/log 2>&1 &
```

### TanStack Router auto-gen
- Criar `frontend/src/routes/agencia.tsx` faz o Vite plugin atualizar `routeTree.gen.ts` automaticamente (não precisa editar manualmente)
- Mas se o dev server está rodando antigo, precisa reiniciar para pegar

### Claude Opus tom artístico
- Prompts com voz de "mestre artista" funcionam — Claude pega o tom imediatamente
- Tom muda completamente: de "MRR cresceu 6,4% com tráfego orgânico forte" → "O motor está girando, mas o gesto certo agora é..."
- Cada agente (Gerente vs Produtor vs Tech Hacker) mantém voz própria mesmo com regras de formato unificadas

---

## Arquivos Modificados/Criados

### Backend
- **CRIADO** `backend/src/agents/agentPrompts.js` — 9 prompts personalizados + BASE_RULES universal
- **CRIADO** `backend/src/routes/mvp.js` — endpoints lobby/room/demand/demands/map (in-memory)
- **MOD** `backend/src/agents/ferbPersona.js` — persona artística (mestre, não executivo)
- **MOD** `backend/src/services/ferb.js` — prompt de análise pede "direção que emerge", não "o que está acontecendo"
- **MOD** `backend/src/index.js` — registra rota `/api/mvp`

### Frontend
- **CRIADO** `frontend/src/routes/agencia.tsx` — lobby + roteamento para AgentRoom
- **CRIADO** `frontend/src/components/agency/AgentCard.tsx`
- **CRIADO** `frontend/src/components/agency/AgentRoom.tsx` (com poll 2s)
- **CRIADO** `frontend/src/components/agency/DemandModal.tsx`
- **CRIADO** `frontend/src/styles/agency.css` — design glassmorphism, animações
- **MOD** `frontend/src/components/TabBar.tsx` — adicionou aba "Agência"
- **MOD** `frontend/src/routes/index.tsx` — linguagem artística (Eye icon, "Leitura do momento", "Pontos de tensão", "FERB vê")

### Commits
1. `5811eee` — refactor(ferb): persona artística — leitura por direção, não condenação
2. `39328f5` — feat(agency): Agência Virtual MVP — sistema Habbo-style de agentes
3. `07ebc1b` — fix(agency): remover markdown/emojis das respostas dos agentes

---

## Tarefas Pendentes

- [ ] **Mapa Regional** — implementar SVG interativo do Brasil consumindo `/api/mvp/map/:artistId` (mock já existe)
- [ ] **Agentes conversam entre si** — agente delegar para outro agente
- [ ] **WebSocket** — substituir poll de 2s por real-time updates
- [ ] **Persistência** — quando o backend reinicia, demandas se perdem. Adicionar Prisma + Postgres OU JSON file storage no curto prazo
- [ ] **FIRECRAWL_API_KEY** no `backend/.env` para habilitar feed Instagram
- [ ] **Cron job 6:30 AM** — relatório FERB diário com node-cron
- [ ] **Deploy DigitalOcean** — 24/7 access
- [ ] **Phase 2 tabs**: Movement, Creation, Opportunities, Identity (atualmente "ComingSoon")

---

## Stack Final do FERB Hoje

| Camada | Tecnologia |
|--------|------------|
| Backend | Express.js + Anthropic SDK (`claude-opus-4-5`) |
| Frontend | React 19 + TanStack Router + Tailwind v4 + shadcn/ui |
| Build | Vite 7.3.1 (pinned), `@tailwindcss/vite` 4.2.1 (pinned), `@vitejs/plugin-react` 5.x |
| Animação | Framer Motion |
| Dados | Chartmetric API + in-memory (MVP Agência) |
| Hospedagem | GitHub `worldfromhands/ferb` (não deployed ainda) |

---

## API Endpoints Atuais

```
GET  /health
GET  /api/home/:artistId
POST /api/home/:artistId/refresh
GET  /api/instagram/recent?username=
GET  /api/audience/...
GET  /api/relations/...
GET  /api/execution/...

# Agência Virtual MVP
GET  /api/mvp/lobby/:artistId       → 9 agents com mood + demanda ativa
GET  /api/mvp/room/:agentId         → agente + histórico de demandas
POST /api/mvp/demand/:agentId       → cria demanda + chama Claude
GET  /api/mvp/demands/:agentId      → histórico
GET  /api/mvp/map/:artistId         → dados regionais (mock)
```

---

## Workarounds e Notas Importantes

### Encoding
- Git warning CRLF/LF aparece em todos os commits no Windows — é cosmético, não quebra nada
- Site-export-extracted tem um `.workspace/` que aparece como submodule sem commit — usar `git add` com arquivos específicos, não `git add -A`

### Vite + TanStack Router
- Versões PRECISAM ser exatamente: `vite@7.3.1`, `@tailwindcss/vite@4.2.1`, `@vitejs/plugin-react@5.x`
- Vite 8 quebra `@vitejs/plugin-react@5`
- Vite 6 quebra `@tailwindcss/vite@4.3+`

### Prompts no Claude API
- Para output limpo (texto puro), instrução tem que aparecer em DOIS lugares: system prompt + user prompt
- Apenas system não é suficiente — Claude ainda usa `**bold**` ocasionalmente em respostas estruturadas

---

## Status Final da Sessão

- Backend rodando em `localhost:3000`
- Frontend rodando em `localhost:5173`
- Acessar: `http://localhost:5173/agencia` para a Agência Virtual
- Todos os 9 agentes testados via curl com demandas reais e respostas coerentes
- Persona artística do FERB ativa na Home

---

## Registro Bruto da Sessão

### Pedidos do usuário (ordem cronológica)

1. "QUERO QUE O FERB TENHA UMA LINGUAGEM MAIS ARTISTICA, NAO QUERO QUE TRAGA OPINIAO PREDATORIA DE EMPRESARIO, QUERO QUE SEJA UM MESTRE ARTISTA QUE ANALISA DADOS, AO FAZER A ANALISE QUERO QUE ME TRAGA UM DIRECIONAMENTO E NAO SÓ ERROS OU CONDENAÇOES"
   - Resultado: persona reescrita, UI alinhada (Eye, Pontos de tensão, etc), commit `5811eee`

2. "FAÇA O QUE ESTA NESSSE ARQUIVO /mnt/user-data/outputs/CLAUDE_CODE_PROMPT_MVP_SIMPLES.md"
   - Arquivo não existia localmente; user colou o conteúdo
   - Resultado: MVP Agência implementado adaptado à stack atual (TanStack Router + sem Prisma), commit `39328f5`

3. "teste a agencia virtual oferencendo algumas demandas base para eles para teste"
   - Testado todos os 9 agentes via curl
   - Identificado bug: markdown bold persistindo
   - Corrigido com reforço duplo de instrução (system + user), commit `07ebc1b`

4. "me mande o localhost para abrir" → "n esta abrindo"
   - Frontend tinha caído; reiniciado
   - Resultado: rodando em http://localhost:5173/agencia

### Bugs encontrados e resolvidos durante a sessão

1. **`/api/mvp/lobby/kyan` retornando 404** — backend rodando em 3000 era versão antiga. Solução: kill all node + restart com `PORT=3000` explícito.

2. **Respostas dos agentes vinham com `**bold**` markdown** — instrução só no system prompt não bastava. Solução: adicionar regra no user prompt também.

3. **Frontend caiu sem reabrir após teste** — Vite dev server foi morto junto com os node processes. Solução: subir de novo manualmente.

### Comandos úteis aprendidos nesta sessão

```bash
# Matar todos os node no Windows
powershell -command "Get-Process -Name 'node' -ErrorAction SilentlyContinue | Stop-Process -Force"

# Iniciar backend em porta específica em background
cd backend && PORT=3000 node src/index.js > /tmp/log 2>&1 &

# Iniciar frontend
cd frontend && npm run dev > /tmp/frontend.log 2>&1 &

# Testar endpoint MVP com formatação legível
curl -s -X POST http://localhost:3000/api/mvp/demand/manager \
  -H "Content-Type: application/json" \
  -d '{"title":"...", "description":"...", "priority":"high"}' \
  | node -e "const d=require('fs').readFileSync(0,'utf8'); const r=JSON.parse(d); console.log(r.agentResponse)"
```
