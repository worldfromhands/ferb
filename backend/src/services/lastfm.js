/**
 * Last.fm API — só chave (sem OAuth), só leitura.
 * Docs: https://www.last.fm/api
 *
 * Env (backend/.env):
 *   LASTFM_API_KEY=       (grátis e instantânea em https://www.last.fm/api/account/create)
 *   KYAN_LASTFM_NAME=     (opcional — default "Kyan")
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require(path.join(__dirname, '../../node_modules/axios/dist/node/axios.cjs'));

const BASE   = 'http://ws.audioscrobbler.com/2.0/';
const KEY    = () => process.env.LASTFM_API_KEY;
const ARTIST = process.env.KYAN_LASTFM_NAME || 'Kyan';

function isConfigured() { return Boolean(KEY()); }

// Cache 30min
const cache = new Map();
const TTL   = 30 * 60 * 1000;
async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;
  const data = await fn();
  cache.set(key, { ts: Date.now(), data });
  return data;
}

async function call(method, extra = {}) {
  const r = await axios.get(BASE, {
    params: { method, api_key: KEY(), format: 'json', autocorrect: 1, ...extra },
  });
  if (r.data && r.data.error) {
    throw new Error(`Last.fm: ${r.data.message || r.data.error}`);
  }
  return r.data;
}

const num = (v) => (v == null ? null : Number(v));

async function getArtistInfo(artist = ARTIST) {
  return cached(`info:${artist}`, async () => {
    const d = await call('artist.getInfo', { artist });
    const a = d.artist;
    if (!a) return null;
    return {
      name:      a.name,
      url:       a.url,
      listeners: num(a.stats?.listeners),
      playcount: num(a.stats?.playcount),
      tags:      (a.tags?.tag || []).map(t => t.name),
      similar:   (a.similar?.artist || []).map(s => s.name),
      bio:       (a.bio?.summary || '').replace(/<[^>]*>/g, '').trim(),
    };
  });
}

async function getTopTracks(artist = ARTIST, limit = 10) {
  return cached(`toptracks:${artist}:${limit}`, async () => {
    const d = await call('artist.getTopTracks', { artist, limit });
    return (d.toptracks?.track || []).map(t => ({
      name:      t.name,
      playcount: num(t.playcount),
      listeners: num(t.listeners),
      url:       t.url,
    }));
  });
}

async function getSnapshot(artist = ARTIST) {
  if (!isConfigured()) return null;
  try {
    const [info, topTracks] = await Promise.all([
      getArtistInfo(artist),
      getTopTracks(artist, 10).catch(() => []),
    ]);
    return { info, topTracks };
  } catch (e) {
    console.error('[lastfm] snapshot:', e.message);
    return null;
  }
}

module.exports = {
  isConfigured,
  getArtistInfo,
  getTopTracks,
  getSnapshot,
};
