/**
 * Snapshot agregado do YouTube (extraído dos CSVs do YouTube Studio).
 * Lê o JSON local — fonte de verdade pra UI e pro contexto dos agentes.
 */
const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'youtube-analytics.json');

let cache = null;
let cacheTs = 0;
const TTL = 60 * 1000;

function load() {
  if (cache && Date.now() - cacheTs < TTL) return cache;
  if (!fs.existsSync(FILE)) return null;
  try {
    cache = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    cacheTs = Date.now();
    return cache;
  } catch (e) {
    console.error('[youtubeAnalytics] parse falhou:', e.message);
    return null;
  }
}

const get = () => load();
const summary       = () => load()?.summary || null;
const topTracks     = (n = 10) => (load()?.topTracks || []).slice(0, n);
const topCountries  = (n = 10) => (load()?.topCountries || []).slice(0, n);
const trafficSources= ()       => load()?.trafficSources || [];
const contentSplit  = ()       => load()?.contentSplit || {};
const playlists     = ()       => load()?.playlists || [];
const topPosts      = (n = 8)  => (load()?.topPosts || []).slice(0, n);

module.exports = { get, summary, topTracks, topCountries, trafficSources, contentSplit, playlists, topPosts };
