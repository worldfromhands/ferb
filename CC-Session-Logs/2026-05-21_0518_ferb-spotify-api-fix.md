# Sessão: 21-05-2026 05:18 - ferb-spotify-api-fix

## Referência Rápida
**Tópicos:** Spotify Web API, restrições 2024/2025, Client Credentials, migração Prisma, resiliência de serviço
**Projetos:** FERB (agente IA diário do KYAN)
**Resultado:** Spotify integrado e funcionando com a nova API; serviço reescrito para sobreviver às restrições do Dev Mode; backend rodando na porta 3000.

## Decisões Tomadas
- Spotify: abandonar `top-tracks` e `related-artists` (ambos 403 via Client Credentials desde 2024) — substituir `top-tracks` pelo endpoint de `search`.
- `getSnapshot` agora usa wrapper `safe()` por chamada — falha parcial nunca derruba o snapshot inteiro.
- `relatedArtists` do Spotify fica vazio; a Home faz fallback para os related artists do Chartmetric.
- Adicionado `getAlbumTracks()` para puxar faixas do EP/álbum mais recente como complemento.
- Backend roda explicitamente com `PORT=3000` (proxy do Vite aponta para 3000), apesar do `.env` ter `PORT=3333`.

## Principais Aprendizados
- A API do Spotify, via Client Credentials flow, em apps no Dev Mode (2025):
  - ✅ `GET /artists/{id}` — funciona, mas NÃO retorna `followers`, `popularity` nem `genres`.
  - ✅ `GET /artists/{id}/albums` — funciona.
  - ✅ `GET /albums/{id}/tracks` — funciona.
  - ✅ `GET /search` — funciona.
  - ❌ `GET /artists/{id}/top-tracks` — 403 Forbidden.
  - ❌ `GET /artists/{id}/related-artists` — 403 Forbidden.
- Dev Mode do Spotify limita `limit` a no máximo **10** por request. Valores 20/50 retornam `400 Invalid limit`.
- `followers`/`popularity` devem vir do Chartmetric, não do Spotify (Spotify não expõe mais via Client Credentials).
- Erro de TypeError (ex.: `r.data.followers.total` em objeto sem `followers`) cai no `.catch` do axios mas sem `e.response` — daí `STATUS: undefined`.

## Tarefas Pendentes
- [ ] YOUTUBE_API_KEY — usuário precisa pegar no Google Cloud Console e colar no `.env` (`youtubeConfigured: false`)
- [ ] Commit das mudanças Prisma + Spotify no GitHub (schema, seed, migrations, config/prisma.js, mvp.js, home.js, execution.js, package.json, .gitignore, services/spotify.js)
- [ ] Reiniciar/verificar o frontend (Vite) após as mudanças
- [ ] Chartmetric `relatedArtists` retornando 0 — investigar (Home mostra related vazio)
- [ ] FIRECRAWL_API_KEY — para feed de fotos do Instagram
- [ ] Concílio de agentes, mapa SVG do Brasil, DNA Musical, deploy DigitalOcean

## Configuração / Dependências
- `backend/.env` (gitignored — NUNCA commitar):
  - `SPOTIFY_CLIENT_ID=f1f95a15eb1a4d19a7fda3e98b4450d9` (app "FERB Music", conta Premium)
  - `SPOTIFY_CLIENT_SECRET=12cd2f2093f04c9ab2e50c6daf0de106`
  - `KYAN_SPOTIFY_ID=05qCf6M7E7AxizHVmrcPqh`
  - `YOUTUBE_API_KEY=` (vazio, pendente)
- Backend: `cd backend && PORT=3000 node src/index.js`
- Health: http://localhost:3000/health
- Home: http://localhost:3000/api/home/kyan

## Arquivos Modificados
- `backend/.env` — credenciais Spotify novas
- `backend/src/services/spotify.js` — reescrito: resiliente, `safe()` wrapper, `searchTopTracks`, `getAlbumTracks`, limites 10

## Estado de Verificação (testado nesta sessão)
- Spotify snapshot: Artist=Kyan, image OK, 10 albums, 5 tracks via search, 13 faixas do álbum recente.
- Home endpoint: `spotifyConfigured: true`, `spotifyArtist: Kyan`, `spotifyTopTracks: 5`, `albums: 10`, `overallStatus: warning`, `pendingTasks: 3`.

---

## Registro Bruto da Sessão
Continuação da migração Prisma (já concluída em sessão anterior). Tarefa desta sessão: aplicar as novas credenciais Spotify (app Premium "FERB Music").

1. Atualizado `backend/.env` com CLIENT_ID/SECRET novos.
2. Backend reiniciado em PORT=3000 — Spotify retornava 404, depois 403.
3. Diagnóstico via testes diretos do axios:
   - Token auth OK.
   - `/artists/{id}` OK mas sem followers/popularity.
   - `/artists/{id}/top-tracks` → 403.
   - `/artists/{id}/related-artists` → 403.
   - `/artists/{id}/albums` OK com limit≤10, `400 Invalid limit` com 20/50.
   - `/search` e `/albums/{id}/tracks` OK.
4. `spotify.js` reescrito: wrapper `safe()`, `searchTopTracks` substitui top-tracks, `getAlbumTracks` adicionado, todos os `limit` para 10, `relatedArtists: []` (fallback Chartmetric).
5. Testado: snapshot e home endpoint funcionando.
