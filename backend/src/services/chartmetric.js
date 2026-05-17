const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const BASE      = 'https://api.chartmetric.com/api';
const ARTIST_ID = process.env.KYAN_ARTIST_ID || '3419361';

// Importa axios pelo caminho absoluto do node_modules do backend
const axios = require(path.join(__dirname, '../../node_modules/axios/dist/node/axios.cjs'));

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

function h(token) { return { Authorization: `Bearer ${token}` }; }
function first(v) { return Array.isArray(v) ? v[0] : v; }

async function getSpotifyStats(id = ARTIST_ID) {
  const token = await getToken();
  const res = await axios.get(`${BASE}/artist/${id}/stat/spotify`, {
    headers: h(token), params: { latest: true },
  });
  return res.data.obj;
}

async function getInstagramStats(id = ARTIST_ID) {
  try {
    const token = await getToken();
    const res = await axios.get(`${BASE}/artist/${id}/stat/instagram`, {
      headers: h(token), params: { latest: true },
    });
    return res.data.obj;
  } catch { return null; }
}

async function getTikTokStats(id = ARTIST_ID) {
  try {
    const token = await getToken();
    const res = await axios.get(`${BASE}/artist/${id}/stat/tiktok`, {
      headers: h(token), params: { latest: true },
    });
    return res.data.obj;
  } catch { return null; }
}

function calcStatus(diff) {
  if (diff == null) return 'aprendendo';
  if (diff > 0)     return 'acima';
  if (diff < 0)     return 'abaixo';
  return 'dentro_do_normal';
}

async function getAudienceMetrics(id = ARTIST_ID) {
  const [spotify, instagram, tiktok] = await Promise.all([
    getSpotifyStats(id),
    getInstagramStats(id),
    getTikTokStats(id),
  ]);

  const metrics = [];

  if (spotify) {
    const listeners  = first(spotify.listeners);
    const followers  = first(spotify.followers);
    const popularity = first(spotify.popularity);

    if (listeners)
      metrics.push({ group: 'Streaming', label: 'Monthly Listeners',    value: listeners.value,   delta: listeners.diff  ?? null,        status: calcStatus(listeners.diff) });
    if (followers)
      metrics.push({ group: 'Streaming', label: 'Spotify Followers',    value: followers.value,   delta: followers.diff  ?? null,        status: calcStatus(followers.diff) });
    if (popularity)
      metrics.push({ group: 'Streaming', label: 'Popularidade Spotify', value: popularity.value,  delta: popularity.weekly_diff ?? null, status: calcStatus(popularity.weekly_diff) });
  }

  if (instagram) {
    const followers = first(instagram.followers);
    if (followers)
      metrics.push({ group: 'Redes Sociais', label: 'Instagram (seg.)', value: followers.value, delta: followers.weekly_diff ?? null, status: calcStatus(followers.weekly_diff) });
  }

  if (tiktok) {
    const followers = first(tiktok.followers);
    const likes     = first(tiktok.likes);
    if (followers)
      metrics.push({ group: 'Redes Sociais', label: 'TikTok (seg.)',  value: followers.value, delta: followers.diff ?? null, status: calcStatus(followers.diff) });
    if (likes)
      metrics.push({ group: 'Redes Sociais', label: 'TikTok Likes',   value: likes.value,     delta: likes.diff ?? null,     status: calcStatus(likes.diff) });
  }

  return metrics;
}

async function getHomeMetrics(id = ARTIST_ID) {
  const spotify = await getSpotifyStats(id);
  if (!spotify) return [];
  const listeners  = first(spotify.listeners);
  const followers  = first(spotify.followers);
  const popularity = first(spotify.popularity);
  return [
    { label: 'Monthly Listeners',    current: listeners?.value,   delta: listeners?.diff ?? null },
    { label: 'Spotify Followers',    current: followers?.value,   delta: followers?.diff ?? null },
    { label: 'Popularidade Spotify', current: popularity?.value,  delta: popularity?.weekly_diff ?? null },
  ].filter(m => m.current != null);
}

module.exports = { getAudienceMetrics, getHomeMetrics };
