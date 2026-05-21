/**
 * Spotify Web API — Client Credentials flow.
 * Docs: https://developer.spotify.com/documentation/web-api
 *
 * Nota 2025: Spotify restringiu vários endpoints a OAuth com user token.
 * Aqui usamos apenas os endpoints disponíveis via Client Credentials:
 *   ✅  GET /artists/{id}          — info básica (sem followers/popularity)
 *   ✅  GET /artists/{id}/albums   — discografia completa
 *   ✅  GET /albums/{id}/tracks    — faixas de um álbum
 *   ✅  GET /search                — busca de tracks
 *   ❌  GET /artists/{id}/top-tracks       → 403
 *   ❌  GET /artists/{id}/related-artists  → 403
 *
 * Env vars necessárias em backend/.env:
 *   SPOTIFY_CLIENT_ID=
 *   SPOTIFY_CLIENT_SECRET=
 *   KYAN_SPOTIFY_ID=         (opcional — default abaixo)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const axios = require(path.join(__dirname, '../../node_modules/axios/dist/node/axios.cjs'));

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const BASE      = 'https://api.spotify.com/v1';

const KYAN_SPOTIFY_ID = process.env.KYAN_SPOTIFY_ID || '05qCf6M7E7AxizHVmrcPqh';

let token        = null;
let tokenExpires = 0;

function isConfigured() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

async function authenticate() {
  if (!isConfigured()) throw new Error('SPOTIFY_CLIENT_ID/SECRET nao configurados em backend/.env');
  const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const r = await axios.post(
    TOKEN_URL,
    new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    {
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${creds}`,
      },
    }
  );
  token        = r.data.access_token;
  tokenExpires = Date.now() + ((r.data.expires_in || 3600) * 1000) - 30000;
}

async function getToken() {
  if (!token || Date.now() >= tokenExpires) await authenticate();
  return token;
}

const h = (t) => ({ Authorization: `Bearer ${t}` });

// Cache 10min
const cache = new Map();
const TTL   = 10 * 60 * 1000;

async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;
  const data = await fn();
  cache.set(key, { ts: Date.now(), data });
  return data;
}

// Wrapper resiliente — nunca joga erro para fora
async function safe(fn, fallback = null) {
  try { return await fn(); }
  catch (e) {
    const status = e.response?.status;
    if (status === 403) console.warn('[spotify] 403 - endpoint requer OAuth:', e.config?.url || e.message);
    else console.error('[spotify] erro:', e.message);
    return fallback;
  }
}

// ─── ARTIST ────────────────────────────────────────────

async function getArtist(id = KYAN_SPOTIFY_ID) {
  return cached(`artist:${id}`, async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artists/${id}`, { headers: h(t) });
    return {
      id:         r.data.id,
      name:       r.data.name,
      // followers e popularity não são retornados via Client Credentials desde 2024
      followers:  r.data.followers?.total ?? null,
      popularity: r.data.popularity     ?? null,
      genres:     r.data.genres         || [],
      image:      r.data.images?.[0]?.url || null,
      external:   r.data.external_urls?.spotify || null,
    };
  });
}

// ─── ALBUMS ────────────────────────────────────────────

async function getAlbums(id = KYAN_SPOTIFY_ID, market = 'BR') {
  return cached(`albums:${id}:${market}`, async () => {
    const t = await getToken();
    // Dev Mode limita a max 10 por request
    const r = await axios.get(`${BASE}/artists/${id}/albums`, {
      headers: h(t),
      params: { include_groups: 'album,single', limit: 10 },
    });
    return (r.data.items || []).map(a => ({
      id:          a.id,
      name:        a.name,
      type:        a.album_type,
      releaseDate: a.release_date,
      totalTracks: a.total_tracks,
      image:       a.images?.[0]?.url || null,
      url:         a.external_urls?.spotify,
    }));
  });
}

// ─── ALBUM TRACKS ─────────────────────────────────────

async function getAlbumTracks(albumId) {
  return cached(`album-tracks:${albumId}`, async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/albums/${albumId}/tracks`, {
      headers: h(t), params: { limit: 50 },
    });
    return (r.data.items || []).map(tr => ({
      id:         tr.id,
      name:       tr.name,
      trackNumber: tr.track_number,
      durationMs: tr.duration_ms,
      preview:    tr.preview_url,
      url:        tr.external_urls?.spotify,
      explicit:   tr.explicit,
    }));
  });
}

// ─── SEARCH TRACKS ─────────────────────────────────────
// Substituto para top-tracks (403). Busca as músicas mais relevantes de KYAN.

async function searchTopTracks(artistName = 'Kyan', market = 'BR') {
  return cached(`search-tracks:${artistName}:${market}`, async () => {
    const t = await getToken();
    // Dev Mode limita a max 10 por request
    const r = await axios.get(`${BASE}/search`, {
      headers: h(t),
      params: { q: `artist:${artistName}`, type: 'track', market, limit: 10 },
    });
    // Filtra apenas faixas que têm KYAN como artista
    const tracks = (r.data.tracks?.items || [])
      .filter(tr => tr.artists?.some(a => a.name.toLowerCase().includes('kyan')))
      .slice(0, 10);

    return tracks.map(tr => ({
      id:          tr.id,
      name:        tr.name,
      album:       tr.album?.name,
      cover:       tr.album?.images?.[0]?.url || null,
      releaseDate: tr.album?.release_date,
      popularity:  tr.popularity,
      durationMs:  tr.duration_ms,
      preview:     tr.preview_url,
      url:         tr.external_urls?.spotify,
      explicit:    tr.explicit,
    }));
  });
}

// ─── SNAPSHOT COMPLETO ─────────────────────────────────

async function getSnapshot(id = KYAN_SPOTIFY_ID) {
  if (!isConfigured()) return null;
  try {
    // Chamadas em paralelo — cada uma resiliente
    const [artist, albums] = await Promise.all([
      safe(() => getArtist(id),        null),
      safe(() => getAlbums(id, 'BR'),  []),
    ]);

    // Tracks: tenta search (mais confiável que top-tracks)
    const topTracks = await safe(() => searchTopTracks('Kyan', 'BR'), []);

    // Tracks do álbum mais recente (como complemento)
    let latestAlbumTracks = [];
    if (albums?.length) {
      latestAlbumTracks = await safe(() => getAlbumTracks(albums[0].id), []);
    }

    return {
      artist,
      topTracks,          // via search
      albums,
      latestAlbumTracks,  // faixas do EP/album mais recente
      relatedArtists: [], // 403 — usa Chartmetric para related artists
    };
  } catch (e) {
    console.error('[spotify] snapshot failed:', e.message);
    return null;
  }
}

module.exports = {
  isConfigured,
  getArtist,
  getAlbums,
  getAlbumTracks,
  searchTopTracks,
  getSnapshot,
};
