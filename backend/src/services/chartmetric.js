const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const BASE      = 'https://api.chartmetric.com/api';
const ARTIST_ID = process.env.KYAN_ARTIST_ID || '3419361';
const axios     = require(path.join(__dirname, '../../node_modules/axios/dist/node/axios.cjs'));

let accessToken  = null;
let tokenExpires = 0;

async function authenticate() {
  const res = await axios.post(`${BASE}/token`, {
    refreshtoken: process.env.CHARTMETRIC_API_KEY,
  });
  accessToken  = res.data.token;
  tokenExpires = Date.now() + ((res.data.expires_in || 3600) * 1000) - 30000;
}

async function getToken() {
  if (!accessToken || Date.now() >= tokenExpires) await authenticate();
  return accessToken;
}

const h    = (t) => ({ Authorization: `Bearer ${t}` });
const first = (v) => Array.isArray(v) ? v[0] : v;

// Tiny TTL cache pra não estourar rate-limit
const cache = new Map();
const TTL   = 5 * 60 * 1000;
async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;
  const data = await fn();
  cache.set(key, { ts: Date.now(), data });
  return data;
}

async function safe(promise, fallback = null) {
  try { return await promise; } catch { return fallback; }
}

// ─── ENDPOINTS BÁSICOS ────────────────────────────────

async function getArtistMeta(id = ARTIST_ID) {
  return cached(`meta:${id}`, async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}`, { headers: h(t) });
    return r.data.obj;
  });
}

async function getSpotifyStats(id = ARTIST_ID) {
  return cached(`spotify:${id}`, async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}/stat/spotify`, {
      headers: h(t), params: { latest: true },
    });
    return r.data.obj;
  });
}

async function getInstagramStats(id = ARTIST_ID) {
  return cached(`ig:${id}`, async () => safe((async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}/stat/instagram`, {
      headers: h(t), params: { latest: true },
    });
    return r.data.obj;
  })()));
}

async function getTikTokStats(id = ARTIST_ID) {
  return cached(`tt:${id}`, async () => safe((async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}/stat/tiktok`, {
      headers: h(t), params: { latest: true },
    });
    return r.data.obj;
  })()));
}

async function getYouTubeStats(id = ARTIST_ID) {
  return cached(`yt:${id}`, async () => safe((async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}/stat/youtube`, {
      headers: h(t), params: { latest: true },
    });
    return r.data.obj;
  })()));
}

// ─── GEOGRAFIA ─────────────────────────────────────────

async function getWherePeopleListen(id = ARTIST_ID) {
  return cached(`wpl:${id}`, async () => safe((async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}/where-people-listen`, { headers: h(t) });
    return r.data.obj;
  })()));
}

async function getTopCities(id = ARTIST_ID, limit = 15) {
  const data = await getWherePeopleListen(id);
  if (!data?.cities) return [];
  return Object.entries(data.cities)
    .map(([name, arr]) => ({
      name,
      listeners: arr[0]?.listeners || 0,
      country:   arr[0]?.code2     || null,
    }))
    .sort((a, b) => b.listeners - a.listeners)
    .slice(0, limit);
}

async function getTopCountries(id = ARTIST_ID, limit = 10) {
  const data = await getWherePeopleListen(id);
  if (!data?.countries) return [];
  return Object.entries(data.countries)
    .map(([name, arr]) => ({
      name,
      code:        arr[0]?.code2     || null,
      listeners:   arr[0]?.listeners || 0,
      population:  arr[0]?.population || 0,
      affinity:    arr[0]?.city_affinity || 0,
    }))
    .sort((a, b) => b.listeners - a.listeners)
    .slice(0, limit);
}

// ─── CATÁLOGO ──────────────────────────────────────────

async function getAlbums(id = ARTIST_ID, limit = 20) {
  return cached(`albums:${id}`, async () => safe((async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}/albums`, {
      headers: h(t), params: { limit },
    });
    return r.data.obj || [];
  })(), []));
}

async function getTracks(id = ARTIST_ID, limit = 10) {
  return cached(`tracks:${id}`, async () => safe((async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}/tracks`, {
      headers: h(t), params: { limit, since: '2020-01-01' },
    });
    return r.data.obj || [];
  })(), []));
}

// ─── PLAYLISTS ─────────────────────────────────────────

async function getCurrentPlaylists(id = ARTIST_ID, platform = 'spotify', limit = 10) {
  return cached(`playlists:${id}:${platform}`, async () => safe((async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}/${platform}/current/playlists`, {
      headers: h(t), params: { limit, sortColumn: 'followers', sortOrderDesc: true },
    });
    return r.data.obj || [];
  })(), []));
}

// ─── FAN METRICS / ENGAJAMENTO ─────────────────────────

async function getFanmetrics(id = ARTIST_ID) {
  return cached(`fm:${id}`, async () => safe((async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}/fanmetrics`, {
      headers: h(t), params: { latest: true },
    });
    return r.data.obj;
  })()));
}

// ─── ARTISTAS SIMILARES ────────────────────────────────

async function getRelatedArtists(id = ARTIST_ID, limit = 10) {
  return cached(`related:${id}`, async () => safe((async () => {
    const t = await getToken();
    const r = await axios.get(`${BASE}/artist/${id}/related`, {
      headers: h(t), params: { limit },
    });
    return r.data.obj || [];
  })(), []));
}

// ─── AGREGADORES ───────────────────────────────────────

function calcStatus(diff) {
  if (diff == null) return 'aprendendo';
  if (diff > 0)     return 'acima';
  if (diff < 0)     return 'abaixo';
  return 'dentro_do_normal';
}

async function getAudienceMetrics(id = ARTIST_ID) {
  const [spotify, instagram, tiktok, youtube] = await Promise.all([
    getSpotifyStats(id), getInstagramStats(id), getTikTokStats(id), getYouTubeStats(id),
  ]);

  const metrics = [];
  if (spotify) {
    const l = first(spotify.listeners), f = first(spotify.followers), p = first(spotify.popularity);
    if (l) metrics.push({ group: 'Streaming', label: 'Monthly Listeners',    value: l.value, delta: l.diff ?? null, status: calcStatus(l.diff) });
    if (f) metrics.push({ group: 'Streaming', label: 'Spotify Followers',    value: f.value, delta: f.diff ?? null, status: calcStatus(f.diff) });
    if (p) metrics.push({ group: 'Streaming', label: 'Popularidade Spotify', value: p.value, delta: p.weekly_diff ?? null, status: calcStatus(p.weekly_diff) });
  }
  if (instagram) {
    const f = first(instagram.followers);
    if (f) metrics.push({ group: 'Redes Sociais', label: 'Instagram (seg.)', value: f.value, delta: f.weekly_diff ?? null, status: calcStatus(f.weekly_diff) });
  }
  if (tiktok) {
    const f = first(tiktok.followers), l = first(tiktok.likes);
    if (f) metrics.push({ group: 'Redes Sociais', label: 'TikTok (seg.)', value: f.value, delta: f.diff ?? null, status: calcStatus(f.diff) });
    if (l) metrics.push({ group: 'Redes Sociais', label: 'TikTok Likes',  value: l.value, delta: l.diff ?? null, status: calcStatus(l.diff) });
  }
  if (youtube) {
    const subs  = first(youtube.subscribers);
    const views = first(youtube.views);
    if (subs)  metrics.push({ group: 'YouTube', label: 'YouTube Subs',  value: subs.value,  delta: subs.diff  ?? null, status: calcStatus(subs.diff) });
    if (views) metrics.push({ group: 'YouTube', label: 'YouTube Views', value: views.value, delta: views.diff ?? null, status: calcStatus(views.diff) });
  }
  return metrics;
}

async function getHomeMetrics(id = ARTIST_ID) {
  const spotify = await getSpotifyStats(id);
  if (!spotify) return [];
  const l = first(spotify.listeners), f = first(spotify.followers), p = first(spotify.popularity);
  return [
    { label: 'Monthly Listeners',    current: l?.value, delta: l?.diff ?? null },
    { label: 'Spotify Followers',    current: f?.value, delta: f?.diff ?? null },
    { label: 'Popularidade Spotify', current: p?.value, delta: p?.weekly_diff ?? null },
  ].filter(m => m.current != null);
}

/**
 * Snapshot identidade do artista — usado pelo bloco "Quem é você hoje"
 */
async function getIdentitySnapshot(id = ARTIST_ID) {
  const meta = await getArtistMeta(id);
  if (!meta) return null;

  const primaryGenre   = meta.genres?.primary?.name || null;
  const secondaryGenres = (meta.genres?.secondary || []).slice(0, 4).map(g => g.name);

  return {
    name:           meta.name,
    image:          meta.image_url || meta.cover_url || null,
    hometown:       meta.hometown_city || null,
    rank:           meta.cm_artist_rank || null,
    score:          meta.cm_artist_score || null,
    primaryGenre,
    secondaryGenres,
    careerStage:    meta.career_status?.stage || null,
    stageScore:     meta.career_status?.stage_score || null,
    trend:          meta.career_status?.trend || null,
    trendScore:     meta.career_status?.trend_score || null,
    recordLabel:    meta.record_label || null,
    booking:        meta.booking_agent || null,
    description:    meta.description || null,
    moods:          (meta.moods || []).slice(0, 6),
    activities:     (meta.activities || []).slice(0, 6),
  };
}

module.exports = {
  // Originais (compat)
  getAudienceMetrics,
  getHomeMetrics,
  // Novos
  getArtistMeta,
  getIdentitySnapshot,
  getSpotifyStats,
  getInstagramStats,
  getTikTokStats,
  getYouTubeStats,
  getWherePeopleListen,
  getTopCities,
  getTopCountries,
  getAlbums,
  getTracks,
  getCurrentPlaylists,
  getFanmetrics,
  getRelatedArtists,
};
