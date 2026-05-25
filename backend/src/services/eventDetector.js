/**
 * Detector de anomalia: compara DailyMetric de hoje com BaselineSnapshot (7d avg)
 * e cria DetectedEvent quando os thresholds disparam.
 *
 * Mono-artista (KYAN implícito). Quando virar multi, basta scopar por artistId.
 */

const prisma = require('../config/prisma');

const THRESHOLDS = {
  viral_streams:        { multiplier: 5.0, severity: 'critical', platform: 'spotify' },
  spike_streams:        { multiplier: 2.0, severity: 'high',     platform: 'spotify' },
  drop_streams:         { multiplier: 0.5, severity: 'medium',   platform: 'spotify', drop: true },
  viral_playlist_adds:  { multiplier: 3.0, severity: 'high',     platform: 'spotify' },
  drop_playlist_adds:   { multiplier: 0.4, severity: 'high',     platform: 'spotify', drop: true },
  follower_spike:       { absolute:  5000, severity: 'medium',   platform: 'spotify' },
  follower_drop:        { absolute: -3000, severity: 'high',     platform: 'spotify' },
  super_listener_drop:  { multiplier: 0.9, severity: 'medium',   platform: 'spotify', drop: true },
  yt_view_spike:        { multiplier: 3.0, severity: 'high',     platform: 'youtube' },
};

function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

async function loadBaselineMap() {
  const rows = await prisma.baselineSnapshot.findMany({ where: { type: '7d_avg' } });
  return Object.fromEntries(rows.map(r => [r.metric, r.value]));
}

/** Recalcula 7d avg para cada métrica. Chamado pelo job antes do detector. */
async function recalculateBaselines() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const rows = await prisma.dailyMetric.findMany({
    where: { date: { gte: sevenDaysAgo } },
  });
  if (rows.length === 0) return 0;

  const METRICS = [
    'spotifyMonthlyListeners','spotifyStreams','spotifyPlaylistAdds','spotifySaves',
    'spotifyFollowers','spotifySuperListeners','spotifyPopularity',
    'youtubeSubscribers','youtubeViews',
    'instagramFollowers','tiktokFollowers','tiktokLikes',
    'deezerFans','lastfmListeners','lastfmPlaycount',
  ];

  let upserts = 0;
  for (const m of METRICS) {
    const vals = rows.map(r => r[m]).filter(v => v != null);
    if (vals.length === 0) continue;
    const avg = vals.reduce((a,b) => a + b, 0) / vals.length;
    await prisma.baselineSnapshot.upsert({
      where:  { id: `${m}_7d_avg` },
      update: { value: avg, calculatedAt: new Date() },
      create: { id: `${m}_7d_avg`, type: '7d_avg', metric: m, value: avg },
    });
    upserts++;
  }
  return upserts;
}

/** Dedupe: não cria evento se já houver outro do mesmo tipo nas últimas 6h. */
async function createEventDeduped(data) {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const existing = await prisma.detectedEvent.findFirst({
    where: { type: data.type, detectedAt: { gte: sixHoursAgo } },
  });
  if (existing) return existing;
  return prisma.detectedEvent.create({ data });
}

/** Detecta eventos comparando today vs baseline. Retorna lista de eventos criados. */
async function detectEvents() {
  const today = startOfDay(new Date());
  const yesterday = startOfDay(new Date(Date.now() - 24*60*60*1000));

  const [todayRow, yesterdayRow, baselines] = await Promise.all([
    prisma.dailyMetric.findUnique({ where: { date: today } }),
    prisma.dailyMetric.findUnique({ where: { date: yesterday } }),
    loadBaselineMap(),
  ]);

  const current = todayRow || yesterdayRow;
  if (!current) return [];

  const events = [];
  const fmt = (n) => Number(n).toLocaleString('pt-BR');

  const ratioCheck = async (metricName, platform, current, baseline, opts) => {
    if (current == null || baseline == null || baseline === 0) return;
    const ratio = current / baseline;
    const pct = (ratio - 1) * 100;
    if (opts.high && ratio >= opts.high.multiplier) {
      events.push(await createEventDeduped({
        type: opts.high.type,
        severity: opts.high.severity,
        platform,
        title: opts.high.title(pct, fmt(current)),
        description: opts.high.desc(pct, fmt(current), fmt(Math.round(baseline))),
        metricName, currentValue: current, baselineValue: baseline, changePct: pct,
        contextData: JSON.stringify({ date: current && today, ratio }),
      }));
      return;
    }
    if (opts.crit && ratio >= opts.crit.multiplier) {
      events.push(await createEventDeduped({
        type: opts.crit.type,
        severity: opts.crit.severity,
        platform,
        title: opts.crit.title(pct, fmt(current)),
        description: opts.crit.desc(pct, fmt(current), fmt(Math.round(baseline))),
        metricName, currentValue: current, baselineValue: baseline, changePct: pct,
        contextData: JSON.stringify({ date: today, ratio }),
      }));
      return;
    }
    if (opts.drop && ratio <= opts.drop.multiplier) {
      events.push(await createEventDeduped({
        type: opts.drop.type,
        severity: opts.drop.severity,
        platform,
        title: opts.drop.title(pct, fmt(current)),
        description: opts.drop.desc(pct, fmt(current), fmt(Math.round(baseline))),
        metricName, currentValue: current, baselineValue: baseline, changePct: pct,
        contextData: JSON.stringify({ date: today, ratio }),
      }));
    }
  };

  // ── Spotify streams
  await ratioCheck('spotifyStreams', 'spotify', current.spotifyStreams, baselines.spotifyStreams, {
    crit: {
      type: 'viral_streams', severity: 'critical', multiplier: THRESHOLDS.viral_streams.multiplier,
      title: (pct, v) => `Viral: streams ${pct.toFixed(0)}% acima da média (${v})`,
      desc:  (pct, v, b) => `${v} streams hoje vs média de ${b}. Evento viral em andamento — investigar a faixa que está puxando.`,
    },
    high: {
      type: 'spike_streams', severity: 'high', multiplier: THRESHOLDS.spike_streams.multiplier,
      title: (pct, v) => `Spike de streams: +${pct.toFixed(0)}% vs média`,
      desc:  (pct, v, b) => `${v} streams hoje, ${pct.toFixed(0)}% acima do baseline de ${b}.`,
    },
    drop: {
      type: 'drop_streams', severity: 'medium', multiplier: THRESHOLDS.drop_streams.multiplier,
      title: (pct, v) => `Queda de streams: ${Math.abs(pct).toFixed(0)}% abaixo da média`,
      desc:  (pct, v, b) => `Apenas ${v} streams. ${Math.abs(pct).toFixed(0)}% abaixo da média de ${b}.`,
    },
  });

  // ── Spotify playlist adds
  await ratioCheck('spotifyPlaylistAdds', 'spotify', current.spotifyPlaylistAdds, baselines.spotifyPlaylistAdds, {
    high: {
      type: 'viral_playlist_adds', severity: 'high', multiplier: THRESHOLDS.viral_playlist_adds.multiplier,
      title: (pct, v) => `Playlist adds explodindo: +${pct.toFixed(0)}% vs média`,
      desc:  (pct, v, b) => `${v} adds hoje. Música sendo adicionada a muitas playlists — investigar qual faixa.`,
    },
    drop: {
      type: 'drop_playlist_adds', severity: 'high', multiplier: THRESHOLDS.drop_playlist_adds.multiplier,
      title: (pct, v) => `Playlist adds caindo: ${Math.abs(pct).toFixed(0)}% abaixo da média`,
      desc:  (pct, v, b) => `Apenas ${v} adds. Algoritmo pode estar desfavorecendo. Avaliar pitch editorial.`,
    },
  });

  // ── YouTube views
  await ratioCheck('youtubeViews', 'youtube', current.youtubeViews, baselines.youtubeViews, {
    high: {
      type: 'yt_view_spike', severity: 'high', multiplier: THRESHOLDS.yt_view_spike.multiplier,
      title: (pct, v) => `YouTube em alta: +${pct.toFixed(0)}% views vs média`,
      desc:  (pct, v, b) => `${v} views hoje. Investigar qual vídeo está crescendo.`,
    },
  });

  // ── Spotify followers — delta absoluto vs ontem
  if (current.spotifyFollowers != null && yesterdayRow?.spotifyFollowers != null) {
    const delta = current.spotifyFollowers - yesterdayRow.spotifyFollowers;
    if (delta >= THRESHOLDS.follower_spike.absolute) {
      events.push(await createEventDeduped({
        type: 'follower_spike', severity: THRESHOLDS.follower_spike.severity, platform: 'spotify',
        title: `Spike de followers: +${fmt(delta)} em 1 dia`,
        description: `${fmt(delta)} novos followers em 24h. Total: ${fmt(current.spotifyFollowers)}.`,
        metricName: 'spotifyFollowers',
        currentValue: current.spotifyFollowers,
        baselineValue: yesterdayRow.spotifyFollowers,
        changePct: (delta / yesterdayRow.spotifyFollowers) * 100,
        contextData: JSON.stringify({ delta, date: today }),
      }));
    } else if (delta <= THRESHOLDS.follower_drop.absolute) {
      events.push(await createEventDeduped({
        type: 'follower_drop', severity: THRESHOLDS.follower_drop.severity, platform: 'spotify',
        title: `Queda de followers: ${fmt(delta)} em 1 dia`,
        description: `${fmt(Math.abs(delta))} followers perdidos em 24h. Total: ${fmt(current.spotifyFollowers)}.`,
        metricName: 'spotifyFollowers',
        currentValue: current.spotifyFollowers,
        baselineValue: yesterdayRow.spotifyFollowers,
        changePct: (delta / yesterdayRow.spotifyFollowers) * 100,
        contextData: JSON.stringify({ delta, date: today }),
      }));
    }
  }

  return events;
}

module.exports = { detectEvents, recalculateBaselines, loadBaselineMap };
