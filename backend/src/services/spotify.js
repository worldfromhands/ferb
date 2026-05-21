/**
 * Spotify Web API — Client Credentials flow.
 * Docs: https://developer.spotify.com/documentation/web-api
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

// Coloca aqui o ID Spotify do KYAN (URL: spotify.com/artist/<ID>)
const KYAN_SPOTIFY_ID = process.env.KYAN_SPOTIFY_ID || '05qCf6M7E7AxizHVmrcPqh';

let token        = null;
let tokenExpires = 0;

function isConfigured() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

async function authenticate() {
  if (!isConfigured()) {
    throw new Error('SPOTIFY_CLIENT_ID/SECRET nao configurados em backend/.env');
  }
  const creds  = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
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

// ─── ARTIST ────────────────────────────────────────────

async function getArtist(id = KYAN_SPOTIFY_ID) {
  return cached(`artist:${id}`, async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artists/${id}`, { headers: h(t) });
    return {
      id:         r.data.id,
      name:       r.data.name,
      followers:  r.data.followers?.total ?? null,
      popularity: r.data.popularity,
      genres:     r.data.genres || [],
      image:      r.data.images?.[0]?.url || null,
      external:   r.data.external_urls?.spotify || null,
    };
  });
}

async function getTopTracks(id = KYAN_SPOTIFY_ID, market = 'BR') {
  return cached(`toptracks:${id}:${market}`, async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artists/${id}/top-tracks`, {
      headers: h(t), params: { market },
    });
    return (r.data.tracks || []).slice(0, 10).map(tr => ({
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

async function getAlbums(id = KYAN_SPOTIFY_ID, market = 'BR') {
  return cached(`albums:${id}:${market}`, async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artists/${id}/albums`, {
      headers: h(t),
      params: { market, include_groups: 'album,single', limit: 20 },
    });
    return (r.data.items || []).map(a => ({
      id:           a.id,
      name:         a.name,
      type:         a.album_type,
      releaseDate:  a.release_date,
      totalTracks:  a.total_tracks,
      image:        a.images?.[0]?.url || null,
      url:          a.external_urls?.spotify,
    }));
  });
}

async function getRelatedArtists(id = KYAN_SPOTIFY_ID) {
  return cached(`related:${id}`, async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artists/${id}/related-artists`, { headers: h(t) });
    return (r.data.artists || []).slice(0, 10).map(a => ({
      id:         a.id,
      name:       a.name,
      popularity: a.popularity,
      followers:  a.followers?.total,
      image:      a.images?.[0]?.url || null,
      genres:     (a.genres || []).slice(0, 3),
      url:        a.external_urls?.spotify,
    }));
  });
}

/**
 * Snapshot completo Spotify
 */
async function getSnapshot(id = KYAN_SPOTIFY_ID) {
  if (!isConfigured()) return null;
  try {
    const [artist, top, albums, related] = await Promise.all([
      getArtist(id), getTopTracks(id), getAlbums(id), getRelatedArtists(id),
    ]);
    return { artist, topTracks: top, albums, relatedArtists: related };
  } catch (e) {
    console.error('[spotify] snapshot failed:', e.message);
    return null;
  }
}

module.exports = {
  isConfigured,
  getArtist,
  getTopTracks,
  getAlbums,
  getRelatedArtists,
  getSnapshot,
};
