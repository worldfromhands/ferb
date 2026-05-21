# YouTube Data API v3 — Setup

A integração já está implementada. Só falta gerar uma API key (gratuita) e
adicionar 1 variável ao `backend/.env`.

## Passo a passo (~3 minutos)

1. Acessa: https://console.cloud.google.com/
2. No topo, clica em **Select a project** → **New Project**
   - Nome: `FERB` (ou qualquer)
   - Clica em **Create**
3. Espera o projeto criar e seleciona ele
4. No menu lateral: **APIs & Services** → **Library**
5. Busca por **YouTube Data API v3** → clica → **Enable**
6. Volta no menu lateral: **APIs & Services** → **Credentials**
7. Clica em **+ Create Credentials** → **API key**
8. Copia a chave que aparece (algo tipo `AIzaSy...`)
9. (Opcional, recomendado) Clica em **Restrict Key**:
   - Em **API restrictions**, marca **YouTube Data API v3** apenas
   - Salva
10. Abre `backend/.env` e adiciona:

```
YOUTUBE_API_KEY=AIzaSy...sua_chave_aqui
KYAN_YOUTUBE_HANDLE=kyanmaloka
```

11. Reinicia o backend:

```bash
cd backend
npm run dev
```

## Quota

YouTube Data API v3 tem **10.000 units/dia gratuitos**. Cada operação consome:
- `channels.list` → 1 unit
- `search.list` → 100 units (caro!)
- `videos.list` → 1 unit

Por isso o service tem cache de 30min — uma carga completa custa ~110 units.
Você pode fazer ~90 requisições de Home por dia. Mais que suficiente.

## O que ativa

- **Bloco YouTube** na Home: inscritos, views totais, contagem de vídeos
- **Top 6 vídeos recentes** com thumbnail, views, likes
- **Tech Hacker e Marketer** passam a ter dados do YouTube no contexto

## Descobrir o channel_id (alternativa ao handle)

Se quiser usar o ID direto em vez do @handle:

1. Abre o canal no YouTube
2. URL é tipo `youtube.com/channel/UCxxxxxxxxxxxxx` — copia esse UC...
3. No `.env`:

```
KYAN_YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxx
```

O handle só é necessário se você não tiver o channel_id.
