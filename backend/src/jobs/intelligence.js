/**
 * Ciclo de inteligência diário:
 *   1. Coleta métricas das APIs e grava DailyMetric (uma linha por dia)
 *   2. Recalcula BaselineSnapshot (7d avg) de cada métrica
 *   3. Roda o detector (compara hoje vs baseline -> DetectedEvent)
 *   4. Roda o auto-analyzer (Claude analisa eventos pendentes)
 *
 * Encadeado depois do runDailyReport() pelo cron das 6:30.
 * Pode ser disparado manualmente via /api/intelligence/trigger.
 */

const prisma  = require('../config/prisma');
const cm      = require('../services/chartmetric');
const youtube = require('../services/youtube');
const deezer  = require('../services/deezer');
const lastfm  = require('../services/lastfm');
const { detectEvents, recalculateBaselines } = require('../services/eventDetector');
const { analyzePendingEvents } = require('../services/autoAnalyzer');

async function safe(fn, fallback) {
  try { const r = await fn(); return r == null ? fallback : r; }
  catch (e) { console.error('[intelligence] fonte indisponível:', e.message); return fallback; }
}

function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d; }

// ── 1. Captura DailyMetric do dia ──────────────────────
async function captureDailyMetric() {
  const today = startOfToday();

  const [cmMetrics, yt, dz, lf] = await Promise.all([
    safe(() => cm.getAudienceMetrics(), []),
    safe(() => youtube.getSnapshot(),    null),
    safe(() => deezer.getSnapshot(),     null),
    safe(() => lastfm.getSnapshot(),     null),
  ]);

  const byLabel = Object.fromEntries((cmMetrics || []).map(m => [m.label, m.value]));

  const data = {
    spotifyMonthlyListeners: byLabel['Monthly Listeners']    ?? null,
    spotifyFollowers:         byLabel['Spotify Followers']   ?? null,
    spotifyPopularity:        byLabel['Popularidade Spotify']?? null,
    instagramFollowers:       byLabel['Instagram (seg.)']    ?? null,
    tiktokFollowers:          byLabel['TikTok (seg.)']       ?? null,
    tiktokLikes:              byLabel['TikTok Likes']        ?? null,
    youtubeSubscribers:       yt?.channel?.subscribers       ?? null,
    youtubeViews:             yt?.channel?.views             ?? null,
    deezerFans:               dz?.artist?.fans               ?? null,
    lastfmListeners:          lf?.info?.listeners            ?? null,
    lastfmPlaycount:          lf?.info?.playcount            ?? null,
    source: 'api',
  };

  // Spotify per-day (streams, playlist_adds, saves, super_listeners) ficam null
  // — só vêm via CSV do Spotify for Artists. O detector pula métricas null.

  await prisma.dailyMetric.upsert({
    where:  { date: today },
    update: data,
    create: { date: today, ...data },
  });

  return data;
}

// ── Ciclo completo ─────────────────────────────────────
async function runIntelligenceCycle() {
  console.log('[intelligence] ciclo iniciado');
  try {
    await captureDailyMetric();
    const baselines = await recalculateBaselines();
    const events = await detectEvents();
    let analyzed = 0;
    if (events.length > 0) {
      console.log(`[intelligence] ${events.length} evento(s) detectado(s):`);
      events.forEach(e => console.log(`  - [${e.severity}] ${e.title}`));
      analyzed = await analyzePendingEvents(5);
    } else {
      console.log('[intelligence] sem eventos novos hoje');
    }
    console.log(`[intelligence] ciclo concluído (${baselines} baselines, ${events.length} eventos, ${analyzed} análises)`);
    return { baselines, events: events.length, analyzed };
  } catch (err) {
    console.error('[intelligence] erro no ciclo:', err.message);
    return { error: err.message };
  }
}

module.exports = { runIntelligenceCycle, captureDailyMetric };
