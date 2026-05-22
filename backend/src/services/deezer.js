/**
 * Deezer API — pública, SEM chave, só leitura.
 * Docs: https://developers.deezer.com/api
 *
 * Env (opcional):
 *   KYAN_DEEZER_ID=   (default abaixo — artista KYAN confirmado)
 */

const path  = require('path');
const axios = require(path.join(__dirname, '../../node_modules/axios/dist/node/axios.cjs'));

const BASE = 'https://api.deezer.com';
const KYAN_DEEZER_ID = process.env.KYAN_DEEZER_ID || '99651032';

// Deezer não exige chave — sempre "configurado".
function isConfigured() { return true; }

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

// Deezer devolve { error: {...} } com HTTP 200 quando algo falha.
function check(data) {
  if (data && data.error) {
    throw new Error(`Deezer: ${data.error.message || data.error.type || 'erro'}`);
  }
  return data;
}

async function getArtist(id = KYAN_DEEZER_ID) {
  return cached(`artist:${id}`, async () => {
    const r = await axios.get(`${BASE}/artist/${id}`);
    const a = check(r.data);
    return {
      id:        a.id,
      name:      a.name,
      fans:      a.nb_fan,
      albumsCount: a.nb_album,
      picture:   a.picture_xl || a.picture_big || a.picture_medium || null,
      link:      a.link,
    };
  });
}

async function getTopTracks(id = KYAN_DEEZER_ID, limit = 10) {
  return cached(`top:${id}:${limit}`, async () => {
    const r = await axios.get(`${BASE}/artist/${id}/top`, { params: { limit } });
    const d = check(r.data);
    return (d.data || []).map(t => ({
      id:       t.id,
      title:    t.title,
      rank:     t.rank,
      duration: t.duration,
      album:    t.album?.title || null,
      cover:    t.album?.cover_medium || null,
      preview:  t.preview || null,
      link:     t.link,
    }));
  });
}

async function getAlbums(id = KYAN_DEEZER_ID, limit = 10) {
  return cached(`albums:${id}:${limit}`, async () => {
    const r = await axios.get(`${BASE}/artist/${id}/albums`, { params: { limit } });
    const d = check(r.data);
    return (d.data || []).map(a => ({
      id:          a.id,
      title:       a.title,
      releaseDate: a.release_date,
      tracks:      a.nb_tracks,
      cover:       a.cover_medium || null,
      link:        a.link,
    }));
  });
}

async function getRelated(id = KYAN_DEEZER_ID, limit = 10) {
  return cached(`related:${id}:${limit}`, async () => {
    const r = await axios.get(`${BASE}/artist/${id}/related`, { params: { limit } });
    const d = check(r.data);
    return (d.data || []).map(a => ({
      id:      a.id,
      name:    a.name,
      fans:    a.nb_fan,
      picture: a.picture_medium || null,
      link:    a.link,
    }));
  });
}

async function getSnapshot(id = KYAN_DEEZER_ID) {
  try {
    const [artist, topTracks, albums, related] = await Promise.all([
      getArtist(id),
      getTopTracks(id, 10),
      getAlbums(id, 8),
      getRelated(id, 8),
    ]);
    return { artist, topTracks, albums, related };
  } catch (e) {
    console.error('[deezer] snapshot:', e.message);
    return null;
  }
}

module.exports = {
  isConfigured,
  getArtist,
  getTopTracks,
  getAlbums,
  getRelated,
  getSnapshot,
};
