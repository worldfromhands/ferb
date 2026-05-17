# Sessão: 16-05-2026 - FERB Setup Completo

## Referência Rápida
**Tópicos:** setup, chartmetric, react, design-system, node, express, vite, preview
**Projetos:** FERB
**Resultado:** Projeto estruturado do zero, backend rodando, Chartmetric conectado, dashboard React com Apple Design System funcionando ao vivo

---

## Decisões Tomadas

- **Stack frontend:** Vite + React (não Create React App) — mais rápido, moderno
- **Proxy Vite:** `/api` proxiado para `http://localhost:3000` — evita CORS no dev
- **dotenv path explícito:** `path.join(__dirname, '../.env')` — necessário pois preview roda de diretório diferente
- **Servidores em terminais próprios:** não depender do Claude para manter servidores vivos
- **Artist ID fixo no .env:** `KYAN_ARTIST_ID=3419361` — identificado via busca na API
- **Design System:** dark mode Apple-style, `#0A0A0A` bg, gradiente roxo `#667eea → #764ba2`
- **Watermark EHXIS:** fixed bottom-right, opacity 0.25

---

## Principais Aprendizados

- `dotenv.config()` sem path usa o **cwd do processo**, não a pasta do arquivo — sempre usar path explícito quando o server roda de diretório diferente
- Vite 8: `--root` não é flag válida, é **argumento posicional** (`vite /caminho/root`)
- Preview tool requer `cwd` **relativo** ao project root — para projetos externos, usar path absoluto no `runtimeArgs` do `node`
- Token Chartmetric fica em memória (`let accessToken`) — reseta a cada restart do servidor
- API Chartmetric: autenticar com `POST /api/token` passando `{ refreshtoken: API_KEY }`, depois usar Bearer token

---

## Arquivos Criados / Modificados

### FERB Project (`C:\Users\Kyan\OneDrive\Desktop\CLAUDE ARQUIVOS\FERB\`)
```
backend/
  src/
    index.js              ← servidor Express, dotenv com path explícito
    services/
      chartmetric.js      ← fetchArtistData(), authenticate()
  package.json            ← express, axios, dotenv, cors, nodemon
  .env                    ← CHARTMETRIC_API_KEY, KYAN_ARTIST_ID=3419361

frontend/
  src/
    App.jsx               ← importa ArtistCard
    index.css             ← reset + tipografia Apple-style
    components/
      ArtistCard.jsx      ← dashboard completo com dados reais
      ArtistCard.css      ← design system Apple dark mode
  vite.config.js          ← proxy /api → localhost:3000

.claude/
  launch.json             ← configuração dos 2 servidores para preview

.env.example
.gitignore
README.md
CC-Session-Logs/          ← este arquivo
```

### Claude Config (`C:\Users\Kyan\.claude\`)
```
settings.json             ← MCP obsidian-mcp configurado
commands/
  resume.md
  compress.md
  preserve.md
```

### Obsidian Vault
```
CLAUDE.md                 ← memória permanente do cofre
CEREBRO CLAUDE/05 - PROJETOS/Registros-de-Sessão/  ← logs de sessão
CEREBRO CLAUDE/00 - META/Templates/nota-template.md
```

---

## Configuração e Dependências

**Backend (Node 24.15.0):**
- express ^4.18.2
- axios ^1.6.0
- dotenv ^16.3.1
- cors ^2.8.5
- nodemon ^3.0.1 (dev)

**Frontend:**
- react ^19.2.6
- react-dom ^19.2.6
- vite ^8.0.12
- @vitejs/plugin-react ^6.0.1

**Rodar projeto:**
```powershell
# Terminal 1
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
cd "C:\Users\Kyan\OneDrive\Desktop\CLAUDE ARQUIVOS\FERB\backend"
npm run dev   # porta 3000

# Terminal 2
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
cd "C:\Users\Kyan\OneDrive\Desktop\CLAUDE ARQUIVOS\FERB\frontend"
npm run dev   # porta 5173
```

---

## Erros e Workarounds

| Erro | Causa | Solução |
|------|-------|---------|
| `dotenv` não carrega .env | cwd ≠ pasta do backend | `dotenv.config({ path: path.join(__dirname, '../.env') })` |
| `--root` unknown option Vite 8 | flag removida no Vite 8 | passar root como argumento posicional |
| preview_start cwd absolute path | tool exige path relativo | usar path absoluto no `runtimeArgs` do node.exe |
| Porta 3000 in use | servidor anterior não morreu | `Stop-Process -Name "node" -Force` |
| API key comprometida | usuário colou no chat | orientado a gerar nova key no Chartmetric |

---

## Tarefas Pendentes

- [ ] **Gerar nova API key no Chartmetric** (a antiga foi exposta no chat)
- [ ] **Setup GitHub** — criar repo `ferb-mvp` e fazer primeiro commit
- [ ] **Google Sheets integration** — tarefas, contatos, financeiro
- [ ] Adicionar `.env` ao `.gitignore` (já está, confirmar antes do commit)
- [ ] Semana 2: PostgreSQL + cronjob 6:30 AM
- [ ] Semana 3: Google Sheets + Claude API
- [ ] Semana 4: Deploy DigitalOcean

---

## Dados do Artista (Chartmetric ID: 3419361)

| Plataforma | Métrica | Valor |
|------------|---------|-------|
| Spotify | Ouvintes mensais | 3.237.018 |
| Spotify | Seguidores | 1.048.433 |
| Instagram | Seguidores | 1.597.519 |
| YouTube | Views totais | 268.099.959 |
| YouTube | Inscritos | 726.000 |
| TikTok | Seguidores | 328.300 |
| Chartmetric | Score | 81.1 / 100 |
| Chartmetric | Rank global | #10.628 |

---

## Registro Bruto da Sessão

**Setup Obsidian + Claude Code:**
- Extraído files.zip com 7 templates
- Instalado skills resume/compress/preserve em `~/.claude/commands/`
- Criado `~/.claude/settings.json` com MCP obsidian-mcp
- Usuário atualizou com chave real `https://127.0.0.1:27124/`
- Criado CLAUDE.md na raiz do cofre Obsidian
- Criado pasta Registros-de-Sessão em 05 - PROJETOS

**Setup FERB:**
- Lido FERB_SETUP_PROMPT.txt
- Criada estrutura completa de pastas
- Node.js estava instalado em C:\Program Files\nodejs\ (fora do PATH)
- `npm install` → 114 pacotes
- Servidor Express rodando com health check

**Chartmetric:**
- Usuário colou API key no chat (orientado a trocar)
- Criado `services/chartmetric.js` com authenticate() e fetchArtistData()
- Buscado artista "KYAN" → ID 3419361 (3.2M ouvintes, verificado)
- Dados completos retornados com sucesso

**React + Design System:**
- Vite scaffoldado em pasta temporária, copiado para frontend/
- ArtistCard.jsx criado com 6 cards de métricas
- Design System Apple aplicado: dark #0A0A0A, gradiente roxo, animações
- Watermark EHXIS fixed bottom-right

**Preview Servers:**
- launch.json criado em C:\Users\Kyan\Claude\.claude\
- Problemas: cwd absoluto não aceito, node fora do PATH, --root inválido no Vite 8
- Solução: usar C:\Program Files\nodejs\node.exe + args com paths absolutos
- dotenv fix: path explícito para .env
- Dashboard funcionando e screenshot confirmado ✅
- Terminais próprios abertos para persistência independente do Claude
