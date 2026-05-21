/**
 * YouTube Data API v3 — sem OAuth, só API key.
 * Docs: https://developers.google.com/youtube/v3
 *
 * Env vars necessárias em backend/.env:
 *   YOUTUBE_API_KEY=
 *   KYAN_YOUTUBE_CHANNEL_ID=     (opcional — default abaixo se descobrir)
 *   KYAN_YOUTUBE_HANDLE=         (alternativa ao channel ID — ex: "kyanmaloka")
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require(path.join(__dirname, '../../node_modules/axios/dist/node/axios.cjs'));

const BASE   = 'https://www.googleapis.com/youtube/v3';
const KEY    = process.env.YOUTUBE_API_KEY;
const HANDLE = process.env.KYAN_YOUTUBE_HANDLE || 'kyanmaloka';
let   CHANNEL_ID = process.env.KYAN_YOUTUBE_CHANNEL_ID || null;

function isConfigured() { return Boolean(KEY); }

// Cache 30min — quota YouTube é apertada (10k unidades/dia)
const cache = new Map();
const TTL   = 30 * 60 * 1000;
async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;
  const data = await fn();
  cache.set(key, { ts: Date.now(), data });
  return data;
}

// ─── Descobre channel_id a partir do @handle (uma vez) ────
async function resolveChannelId() {
  if (CHANNEL_ID) return CHANNEL_ID;
  if (!isConfigured()) return null;
  try {
    const r = await axios.get(`${BASE}/channels`, {
      params: { forHandle: HANDLE, part: 'id', key: KEY },
    });
    CHANNEL_ID = r.data.items?.[0]?.id || null;
    return CHANNEL_ID;
  } catch (e) {
    console.error('[youtube] resolveChannelId:', e.message);
    return null;
  }
}

// ─── Stats do canal (subs, total views, total videos) ────
async function getChannelStats() {
  if (!isConfigured()) return null;
  return cached('channel-stats', async () => {
    const id = await resolveChannelId();
    if (!id) return null;
    const r = await axios.get(`${BASE}/channels`, {
      params: { id, part: 'snippet,statistics,brandingSettings', key: KEY },
    });
    const c = r.data.items?.[0];
    if (!c) return null;
    return {
      id:               c.id,
      title:            c.snippet?.title,
      description:      c.snippet?.description,
      thumbnail:        c.snippet?.thumbnails?.high?.url,
      country:          c.snippet?.country,
      publishedAt:      c.snippet?.publishedAt,
      banner:           c.brandingSettings?.image?.bannerExternalUrl,
      subscribers:      Number(c.statistics?.subscriberCount || 0),
      hiddenSubs:       c.statistics?.hiddenSubscriberCount,
      views:            Number(c.statistics?.viewCount       || 0),
      videos:           Number(c.statistics?.videoCount      || 0),
    };
  });
}

// ─── Top vídeos recentes (search por canal) ──────────────
async function getRecentVideos(limit = 6) {
  if (!isConfigured()) return [];
  return cached(`videos-${limit}`, async () => {
    const id = await resolveChannelId();
    if (!id) return [];

    // 1) Pegar IDs dos vídeos recentes
    const searchRes = await axios.get(`${BASE}/search`, {
      params: { channelId: id, part: 'id,snippet', order: 'date', maxResults: limit, type: 'video', key: KEY },
    });
    const items = searchRes.data.items || [];
    if (!items.length) return [];

    const ids = items.map(i => i.id?.videoId).filter(Boolean).join(',');

    // 2) Pegar stats de cada um
    const statsRes = await axios.get(`${BASE}/videos`, {
      params: { id: ids, part: 'snippet,statistics,contentDetails', key: KEY },
    });

    return (statsRes.data.items || []).map(v => ({
      id:           v.id,
      title:        v.snippet?.title,
      description:  (v.snippet?.description || '').slice(0, 200),
      thumbnail:    v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url,
      publishedAt:  v.snippet?.publishedAt,
      views:        Number(v.statistics?.viewCount    || 0),
      likes:        Number(v.statistics?.likeCount    || 0),
      comments:     Number(v.statistics?.commentCount || 0),
      duration:     v.contentDetails?.duration,
      url:          `https://www.youtube.com/watch?v=${v.id}`,
    }));
  });
}

async function getSnapshot() {
  if (!isConfigured()) return null;
  try {
    const [channel, videos] = await Promise.all([
      getChannelStats(),
      getRecentVideos(6),
    ]);
    return { channel, videos };
  } catch (e) {
    console.error('[youtube] snapshot:', e.message);
    return null;
  }
}

module.exports = {
  isConfigured,
  getChannelStats,
  getRecentVideos,
  getSnapshot,
  resolveChannelId,
};
