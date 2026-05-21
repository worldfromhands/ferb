# Spotify Web API — Setup

A integração com Spotify já está implementada. Só falta criar o app no painel do Spotify
e adicionar duas variáveis ao `backend/.env`.

## Passos

1. Acessa: https://developer.spotify.com/dashboard
2. Faz login com sua conta Spotify (qualquer conta, mesmo free, serve)
3. Clica em **Create App**
   - Name: `FERB`
   - Description: `Sistema operacional artístico — KYAN`
   - Redirect URI: `http://localhost:3000/callback` (não vamos usar, mas o form exige)
   - APIs: marca apenas **Web API**
4. Clica em **Settings** do app criado
5. Copia o **Client ID** e clica em **View client secret** → copia também
6. Abre `backend/.env` e adiciona no final:

```
SPOTIFY_CLIENT_ID=seu_client_id_aqui
SPOTIFY_CLIENT_SECRET=seu_client_secret_aqui
KYAN_SPOTIFY_ID=05qCf6M7E7AxizHVmrcPqh
```

7. Reinicia o backend:

```bash
cd backend
npm run dev
```

## O que isso destrava

Sem credenciais, a Home funciona normalmente com dados do Chartmetric.
Com credenciais, ganha:

- **Top tracks no Spotify** (bloco "Top no Spotify") — capas + popularidade
- **Albums detalhados** com cover art
- **Related artists** com imagens (em vez da versão Chartmetric sem imagens)
- **Audio features futuro** — energy, danceability, tempo, valence de cada track
- **Genres oficiais Spotify** — diferente da classificação Chartmetric

## Endpoints disponíveis no service

`backend/src/services/spotify.js`:

- `getArtist(id)` — followers, popularity, genres, image
- `getTopTracks(id, market='BR')` — top 10 tracks
- `getAlbums(id, market='BR')` — discografia
- `getRelatedArtists(id)` — top 10 similares
- `getSnapshot(id)` — tudo agregado
- `isConfigured()` — checa se credenciais existem

## Custo

Web API é **gratuita**. Client Credentials Flow não precisa de OAuth de usuário.
Limite: tipicamente 100 reqs/min por app — mais que suficiente.
