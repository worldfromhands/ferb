# Sessão: 20-05-2026 21:50 - FERB APIs (Spotify/YouTube) + Briefings de Agentes

## Referência Rápida

**Tópicos:** persona artística, Agência Virtual MVP, expansão Chartmetric, Spotify Web API (bloqueio Premium), YouTube Data API, Instagram service, briefings proativos de agentes, contexto real por agente, Home com 13 blocos

**Projetos:** FERB (sistema operacional artístico do KYAN / EHXIS)

**Resultado:**
- Persona do FERB reescrita (mestre artista, não executivo cobrador)
- Agência Virtual MVP completa: 9 agentes com salas, demandas, briefings
- Chartmetric expandido: identidade, geografia, catálogo, playlists, similares
- Home page reformulada com 13 blocos de dados reais
- Spotify Web API integrado MAS bloqueado (exige Premium)
- YouTube + Instagram services prontos (aguardando API key do YouTube)
- 4 commits pushed para github.com/worldfromhands/ferb

---

## Decisões Tomadas

### Persona artística
- FERB virou "mestre artista que lê dados", não executivo predatório
- Toda análise aponta DIREÇÃO, não condenação
- UI alinhada: "Crítico hoje"→"Pontos de tensão", "FERB acha que"→"Leitura do momento"
- BASE_RULES universal aplicado a todos os 9 agentes (texto puro, sem markdown/emoji, máx 4 frases)

### Agência Virtual — arquitetura
- SEM Prisma — in-memory Maps (demandas perdem no restart do backend)
- SEM Pixi.js — React/CSS puro, grid de cards
- TanStack Router (rota /agencia), não tabs/App.jsx do prompt original
- Delay 4-8s simula "trabalho" do agente entre in_progress→completed
- Poll de 2s no frontend atualiza moods e status

### Briefings de agentes
- Ao entrar na sala, agente mostra RESUMO (1 frase) + SUGESTÃO (movimento da semana)
- Ambos ancorados em dados reais do KYAN via Claude
- Cache 10min — não chama Claude em todo entry
- Endpoint GET /api/mvp/briefing/:agentId + POST .../refresh

### Contexto real por agente
- agentContext.js: cada agente recebe dados específicos do KYAN antes de responder
- Manager→rank/estágio/tendência; Booking→top cidades; Finance→ROI estimado; etc.

### Spotify
- App criado: "FERB Music", redirect http://127.0.0.1:3000/callback
- DECISÃO PENDENTE: assinar Spotify Premium (R$21.90/mês) OU pular Spotify
  → Chartmetric já cobre ~95% dos dados de Spotify

### Home page
- 13 blocos. Bloco "Quem você é hoje" usa career_status real do Chartmetric
- Mapa regional virou REAL (where-people-listen), não mais mock

---

## Principais Aprendizados

### Spotify Web API agora EXIGE Premium
- Erro 403: "Active premium subscription required for the owner of the app"
- Mudança de política da Spotify (2025) — conta free não usa Web API
- Token Client Credentials é emitido normalmente, mas QUALQUER chamada de
  endpoint retorna 403 sem Premium na conta dona do app
- Workaround: Chartmetric já entrega listeners/followers/popularity/albums/
  playlists/cidades/países — só perde cover art de tracks

### Restrições do Spotify Developer Dashboard
- Nome de app NÃO pode começar com "Spot" (bloqueia "SPOTIFY FERB")
- Redirect URI não aceita mais http://localhost — usar http://127.0.0.1 ou https
- Checkbox "Web API" fica travado em conta free, mas marcar "Web Playback SDK"
  permite criar o app mesmo assim (a categoria não bloqueia a API de fato)

### Chrome MCP — allowlist de domínios
- A extensão Claude-in-Chrome tem allowlist; não navega para
  developer.spotify.com nem console.cloud.google.com sem liberar
- Browsers em computer-use são tier "read" — dá pra VER a tela mas não clicar/digitar
- Solução usada: guiar o usuário por screenshots (computer-use screenshot) +
  instruções de texto

### claudeService.ask() limita 300 tokens
- Para o estudo de carreira completo do Gerente, precisou chamar o SDK
  Anthropic direto com max_tokens 2000 (script manager-study.js)

### Briefing JSON parsing
- Claude às vezes embrulha JSON em cercas ```json — agentBriefing.js limpa
  cercas e tem fallback com regex pra extrair o objeto

### Porta backend
- Preview/launch usa PORT do ambiente; backend roda em 3000 quando setado
  explicitamente. Vite proxy aponta para 3000.
- Frontend Vite cai sozinho às vezes — precisa subir de novo manualmente

---

## Arquivos Modificados/Criados

### Backend — criados
- `src/agents/agentPrompts.js` — 9 personas + BASE_RULES
- `src/agents/agentContext.js` — contexto real do KYAN por agente
- `src/agents/agentBriefing.js` — gera resumo + sugestão por agente
- `src/routes/mvp.js` — lobby/room/demand/briefing/map (in-memory)
- `src/services/spotify.js` — Spotify Web API (Client Credentials)
- `src/services/youtube.js` — YouTube Data API v3
- `src/services/instagram.js` — unifica Chartmetric + Firecrawl + Graph
- `src/scripts/manager-study.js` — script one-shot estudo de carreira

### Backend — modificados
- `src/agents/ferbPersona.js` — persona artística
- `src/services/chartmetric.js` — +getIdentitySnapshot, getTopCities/Countries,
  getAlbums, getTracks, getCurrentPlaylists, getRelatedArtists, getFanmetrics, cache
- `src/services/ferb.js` — prompt de análise pede direção
- `src/routes/home.js` — agrega Chartmetric+Spotify+YouTube+Instagram
- `src/index.js` — registra /api/mvp
- `.env` — +SPOTIFY_CLIENT_ID/SECRET, KYAN_SPOTIFY_ID, YOUTUBE_API_KEY (vazio)

### Frontend — criados
- `src/routes/agencia.tsx`
- `src/components/agency/AgentCard.tsx`
- `src/components/agency/AgentRoom.tsx` (com briefing)
- `src/components/agency/DemandModal.tsx`
- `src/styles/agency.css`

### Frontend — modificados
- `src/routes/index.tsx` — Home com 13 blocos
- `src/components/TabBar.tsx` — aba Agência
- `src/routeTree.gen.ts` — rota agencia (auto)

### Docs
- `docs/SPOTIFY_API_SETUP.md`
- `docs/YOUTUBE_API_SETUP.md`
- `docs/FERB_BRIEFING_TECNICO.md` — briefing mestre do cliente
- `CC-Session-Logs/estudo-gerente-carreira-kyan.md`

### Commits (github.com/worldfromhands/ferb, branch master)
- 39328f5 — feat(agency): Agência Virtual MVP
- (persona) — refactor(ferb): persona artística
- c1ebee3 — feat(data): expansão Chartmetric + Spotify
- 38eed39 — feat(agents): briefings + YouTube + Instagram services

---

## Tarefas Pendentes

### Imediato
- [ ] DECISÃO: Spotify Premium (destrava Web API) OU pular
- [ ] YouTube API key — usuário precisa gerar no Google Cloud Console
      (passo-a-passo em docs/YOUTUBE_API_SETUP.md). Adicionar YOUTUBE_API_KEY no .env
- [ ] Commitar o estado atual da sessão (não havia commit pós-briefings se .env mudou)

### Curto prazo (roadmap Fase 1-2)
- [ ] Migrar agentes + demandas para Prisma + PostgreSQL (hoje é in-memory, perde no restart)
- [ ] Discussões entre agentes — "Concílio" (9 agentes opinam, Gerente sintetiza)
- [ ] Mapa SVG interativo do Brasil (27 estados)
- [ ] DNA Musical (audio features) — depende de Spotify Premium ou alternativa
- [ ] Playlist Intelligence
- [ ] FIRECRAWL_API_KEY no .env (habilita posts do Instagram)

### Médio/longo prazo (briefing)
- [ ] Career AI (agente master)
- [ ] Trend Prediction (ML)
- [ ] Multi-tenancy + billing Stripe + white-label
- [ ] Redis + BullMQ, Sentry + PostHog
- [ ] Cron diário 6:30 AM
- [ ] Deploy DigitalOcean

---

## Erros e Contornos (Workarounds)

| Erro | Contorno |
|------|----------|
| Spotify 403 "Premium required" | Usar Chartmetric pra dados de Spotify; ou assinar Premium |
| Nome de app começa com "Spot" rejeitado | Nomear "FERB Music" |
| Redirect URI http://localhost rejeitado | Usar http://127.0.0.1:3000/callback |
| Chrome MCP não navega p/ Spotify/Google | Guiar usuário por screenshot computer-use |
| ask() limitado a 300 tokens | SDK Anthropic direto com max_tokens maior |
| Claude embrulha JSON em ```` ```json ```` | agentBriefing.js limpa cercas + fallback regex |
| Frontend Vite cai sozinho | Reiniciar `npm run dev` manualmente |
| `git add -A` falha (site-export .workspace) | Adicionar arquivos por nome explícito |

---

## Estado dos Servidores ao Fim da Sessão

- Backend: `localhost:3000` (rodar com `cd backend && PORT=3000 node src/index.js`)
- Frontend: `localhost:5173` (`cd frontend && npm run dev`)
- Home: http://localhost:5173
- Agência: http://localhost:5173/agencia

---

## Credenciais (valores reais em backend/.env — NÃO versionado)

- CHARTMETRIC_API_KEY — ativa, funcionando
- CLAUDE_API_KEY — ativa
- KYAN_ARTIST_ID=3419361 (Chartmetric)
- KYAN_SPOTIFY_ID=05qCf6M7E7AxizHVmrcPqh
- SPOTIFY_CLIENT_ID / SECRET — preenchidas mas SEM efeito (conta free, 403)
- YOUTUBE_API_KEY — VAZIO, pendente

---

## Registro Bruto da Sessão (resumo cronológico)

1. Usuário pediu persona mais artística → reescrevi ferbPersona.js + ferb.js + UI da Home.
2. Usuário mandou conteúdo de CLAUDE_CODE_PROMPT_MVP_SIMPLES.md → implementei Agência
   Virtual MVP adaptada (TanStack Router, in-memory, sem Prisma).
3. Testei a Agência com demandas → todos os 9 agentes responderam.
4. Usuário pediu localhost → frontend tinha caído, reiniciei.
5. Usuário pediu info do Gerente → mostrei perfil; pediu estudo completo da carreira →
   criei manager-study.js, gerei estudo, salvei em CC-Session-Logs.
6. Usuário perguntou o que dá pra puxar do Chartmetric → mapeei endpoints.
7. Usuário pediu para usar TUDO do Chartmetric + instalar Spotify API → expandi
   chartmetric.js, criei spotify.js, agentContext.js, reformulei Home (13 blocos).
8. Usuário pediu ativar Spotify + briefings de agentes + Instagram/YouTube APIs →
   criei agentBriefing.js, youtube.js, instagram.js; atualizei AgentRoom com briefing.
9. Tentei ativar Spotify pelo Chrome MCP → bloqueado por allowlist de domínio.
10. Guiei o usuário por screenshots a criar o app Spotify; pegou credenciais.
11. Adicionei credenciais no .env → 403 "Premium required". Spotify bloqueado.
12. Usuário pediu para ver o app → confirmei servidores no ar.
13. Usuário rodou /compress + colou o briefing técnico completo do FERB.

### Estudo de carreira do Gerente (resumo)
Diagnóstico: KYAN em platô disfarçado de estabilidade. 3.2M listeners, score 64
estagnado, Instagram sangrando (-2.6k/sem), trend "gradual decline". Direção:
projeto conceitual com rollout de 8 semanas, Instagram diário, TikTok com frequência
alta. Movimento da semana: vídeo de 1min sinalizando o próximo projeto.
(Completo em CC-Session-Logs/estudo-gerente-carreira-kyan.md)
