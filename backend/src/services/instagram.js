/**
 * Instagram service — unifica três fontes:
 *
 * 1) Chartmetric — métricas históricas (followers, weekly_diff)
 * 2) Firecrawl   — posts recentes (já implementado em routes/instagram.js)
 * 3) Graph API   — opcional, se você tiver conta business + token
 *
 * Por que não usar a Instagram Graph API direto?
 * → Exige Facebook App + Instagram Business + OAuth + token de longa duração.
 *   É um setup de ~30 min e só funciona se @kyanmaloka virar conta business.
 *   Por isso o caminho prático é Chartmetric (números) + Firecrawl (visual).
 *
 * Env vars (opcionais):
 *   INSTAGRAM_ACCESS_TOKEN=         # Graph API user token (long-lived)
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID=  # ID da conta business
 */

const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require(path.join(__dirname, '../../node_modules/axios/dist/node/axios.cjs'));

const cm = require('./chartmetric');

const USERNAME = 'kyanmaloka';
const FIRECRAWL_URL = 'https://api.firecrawl.dev/v2/scrape';

const cache = new Map();
const TTL   = 10 * 60 * 1000;
async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;
  const data = await fn();
  cache.set(key, { ts: Date.now(), data });
  return data;
}

// ─── 1. Métricas via Chartmetric (sempre disponível) ──────

async function getStats() {
  const ig = await cm.getInstagramStats();
  if (!ig) return null;
  const followers = ig.followers?.[0];
  return {
    followers:    followers?.value || null,
    weeklyDelta:  followers?.weekly_diff ?? null,
    monthlyDelta: followers?.monthly_diff ?? null,
    yearlyDelta:  followers?.yearly_diff ?? null,
    fetchedAt:    followers?.timestp || null,
  };
}

// ─── 2. Posts via Firecrawl (opcional, precisa FIRECRAWL_API_KEY) ─

async function getRecentPosts(limit = 12) {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return [];
  return cached(`posts:${limit}`, async () => {
    try {
      const res = await axios.post(FIRECRAWL_URL, {
        url: `https://www.instagram.com/${USERNAME}/`,
        formats: [{
          type: 'json',
          prompt: `Extract up to ${limit} most recent posts from this Instagram profile. For each post return image_url (the post thumbnail), caption (first line if any), permalink (full URL to the post), and posted_at if visible.`,
          schema: {
            type: 'object',
            properties: {
              posts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    image_url: { type: 'string' },
                    caption:   { type: 'string' },
                    permalink: { type: 'string' },
                    posted_at: { type: 'string' },
                  },
                },
              },
            },
          },
        }],
        onlyMainContent: true,
        waitFor: 2500,
      }, {
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      });
      const raw = res.data?.data?.json ?? res.data?.json;
      return (raw?.posts || []).slice(0, limit);
    } catch (e) {
      console.error('[instagram firecrawl]', e.message);
      return [];
    }
  });
}

// ─── 3. Graph API (precisa token business) ────────────────

async function getGraphAPIInsights() {
  const token   = process.env.INSTAGRAM_ACCESS_TOKEN;
  const account = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!token || !account) return null;

  return cached('graph-insights', async () => {
    try {
      const r = await axios.get(`https://graph.facebook.com/v21.0/${account}/insights`, {
        params: {
          metric: 'reach,impressions,profile_views,follower_count',
          period: 'day',
          access_token: token,
        },
      });
      return r.data?.data || null;
    } catch (e) {
      console.error('[instagram graph]', e.message);
      return null;
    }
  });
}

// ─── Snapshot unificado ──────────────────────────────────

async function getSnapshot() {
  const [stats, posts, insights] = await Promise.all([
    getStats(),
    getRecentPosts(6),
    getGraphAPIInsights(),
  ]);
  return {
    username:  USERNAME,
    stats,
    posts,
    insights,
    sources: {
      chartmetric: Boolean(stats),
      firecrawl:   Boolean(process.env.FIRECRAWL_API_KEY),
      graphApi:    Boolean(insights),
    },
  };
}

module.exports = {
  getStats,
  getRecentPosts,
  getGraphAPIInsights,
  getSnapshot,
};
