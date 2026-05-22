/**
 * DNA Musical — perfil sonoro do KYAN.
 *
 * O Spotify desativou /audio-features e /top-tracks em nov/2024 (403 para
 * apps novos). A fonte de audio features aqui é a ReccoBeats — API pública
 * e gratuita criada justamente como substituta:
 *   1. coleta IDs de faixas do KYAN no Spotify (search + álbum recente)
 *   2. ReccoBeats /v1/track mapeia os IDs do Spotify para IDs ReccoBeats
 *   3. ReccoBeats /v1/track/{id}/audio-features devolve BPM, energia, etc.
 *   4. monta o perfil sonoro médio
 */

const path  = require('path');
const axios = require(path.join(__dirname, '../../node_modules/axios/dist/node/axios.cjs'));
const sp    = require('./spotify');

const RECCO = 'https://api.reccobeats.com/v1';

// Cache 6h
let cache = null;
let cacheTs = 0;
const TTL = 6 * 60 * 60 * 1000;

// ── coleta de IDs de faixas do KYAN ────────────────────
async function collectSpotifyTrackIds() {
  const snap = await sp.getSnapshot();
  const ids = [];
  for (const t of (snap?.topTracks || [])) if (t.id) ids.push(t.id);
  // o latestAlbumTracks vem da API de álbum — também tem id
  for (const t of (snap?.latestAlbumTracks || [])) if (t.id) ids.push(t.id);
  return [...new Set(ids)].slice(0, 25);
}

// ── ReccoBeats ─────────────────────────────────────────
async function mapToReccoBeats(spotifyIds) {
  if (!spotifyIds.length) return [];
  const r = await axios.get(`${RECCO}/track`, { params: { ids: spotifyIds.join(',') } });
  return r.data?.content || [];
}

async function getAudioFeatures(reccoId) {
  const r = await axios.get(`${RECCO}/track/${reccoId}/audio-features`);
  return r.data;
}

// ── perfil sonoro médio ────────────────────────────────
function buildSonicProfile(features) {
  const count = features.length;
  if (!count) return null;

  const avg = (k) => Number((features.reduce((s, f) => s + (f[k] || 0), 0) / count).toFixed(3));
  const avgBPM = Number((features.reduce((s, f) => s + (f.tempo || 0), 0) / count).toFixed(1));

  const energy = avg('energy');
  const energyLabel = energy > 0.75 ? 'Alta' : energy > 0.45 ? 'Média' : 'Baixa';

  const valence = avg('valence');
  const moodLabel = valence > 0.65 ? 'Positivo' : valence > 0.35 ? 'Neutro' : 'Melancólico';

  let bpmGenre;
  if (avgBPM < 80)       bpmGenre = 'Slow / Balada';
  else if (avgBPM < 110) bpmGenre = 'R&B / Soul';
  else if (avgBPM < 130) bpmGenre = 'Pop / Trap';
  else if (avgBPM < 150) bpmGenre = 'Funk / Hip-Hop';
  else                   bpmGenre = 'Eletrônico / Fast';

  return {
    tracksAnalyzed:   count,
    avgBPM,
    bpmGenre,
    energy,           energyLabel,
    danceability:     avg('danceability'),
    valence,          moodLabel,
    acousticness:     avg('acousticness'),
    speechiness:      avg('speechiness'),
    instrumentalness: avg('instrumentalness'),
    liveness:         avg('liveness'),
    loudness:         Number((features.reduce((s, f) => s + (f.loudness || 0), 0) / count).toFixed(1)),
    generatedAt:      new Date().toISOString(),
  };
}

// ── snapshot completo ──────────────────────────────────
async function getDNA() {
  if (cache && Date.now() - cacheTs < TTL) return { ...cache, cached: true };

  const spotifyIds = await collectSpotifyTrackIds();
  const rbTracks   = await mapToReccoBeats(spotifyIds);

  // audio-features de cada faixa mapeada (em paralelo, tolerante a falha)
  const features = [];
  await Promise.all(rbTracks.map(async (t) => {
    try {
      const af = await getAudioFeatures(t.id);
      if (af && af.tempo != null) {
        features.push({ ...af, name: t.trackTitle || 'Faixa' });
      }
    } catch { /* faixa sem features — ignora */ }
  }));

  const profile = buildSonicProfile(features);

  const tracks = features
    .map(f => ({
      name:         f.name,
      bpm:          Number((f.tempo || 0).toFixed(1)),
      energy:       Number((f.energy || 0).toFixed(3)),
      danceability: Number((f.danceability || 0).toFixed(3)),
      valence:      Number((f.valence || 0).toFixed(3)),
    }))
    .sort((a, b) => b.bpm - a.bpm);

  const result = { profile, tracks, source: 'reccobeats', generatedAt: new Date().toISOString() };
  cache = result;
  cacheTs = Date.now();
  return result;
}

module.exports = { getDNA };
