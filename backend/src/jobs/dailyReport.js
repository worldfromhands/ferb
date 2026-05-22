/**
 * Job do relatório diário do FERB.
 *
 * 1. Captura as métricas atuais de todas as fontes -> MetricSnapshot
 * 2. Compara com o snapshot anterior de cada métrica (delta)
 * 3. Gera o resumo do dia com a persona do FERB (Claude)
 * 4. Salva/atualiza o DailyReport do dia
 *
 * Reutilizável: roda pelo cron (6:30) e pelo trigger manual (/api/reports/run).
 */

const prisma  = require('../config/prisma');
const cm      = require('../services/chartmetric');
const youtube = require('../services/youtube');
const deezer  = require('../services/deezer');
const lastfm  = require('../services/lastfm');
const ferb    = require('../services/ferb');

async function safe(fn, fallback) {
  try {
    const r = await fn();
    return r == null ? fallback : r;
  } catch (e) {
    console.error('[dailyReport] fonte indisponível:', e.message);
    return fallback;
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── 1. Captura métricas de todas as fontes ─────────────
async function captureMetrics() {
  const items = []; // { source, metric, label, value }

  const cmMetrics = await safe(() => cm.getAudienceMetrics(), []);
  for (const m of cmMetrics) {
    if (m.value == null) continue;
    items.push({
      source: 'chartmetric',
      metric: 'cm_' + String(m.label || 'metric').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      label:  m.label,
      value:  Number(m.value),
    });
  }

  const yt = await safe(() => youtube.getSnapshot(), null);
  if (yt?.channel) {
    if (yt.channel.subscribers != null)
      items.push({ source: 'youtube', metric: 'yt_subscribers', label: 'Inscritos YouTube', value: Number(yt.channel.subscribers) });
    if (yt.channel.views != null)
      items.push({ source: 'youtube', metric: 'yt_views', label: 'Views YouTube', value: Number(yt.channel.views) });
  }

  const dz = await safe(() => deezer.getSnapshot(), null);
  if (dz?.artist?.fans != null) {
    items.push({ source: 'deezer', metric: 'dz_fans', label: 'Fãs Deezer', value: Number(dz.artist.fans) });
  }

  const lf = await safe(() => lastfm.getSnapshot(), null);
  if (lf?.info) {
    if (lf.info.listeners != null)
      items.push({ source: 'lastfm', metric: 'lf_listeners', label: 'Ouvintes Last.fm', value: Number(lf.info.listeners) });
    if (lf.info.playcount != null)
      items.push({ source: 'lastfm', metric: 'lf_playcount', label: 'Plays Last.fm', value: Number(lf.info.playcount) });
  }

  if (items.length) {
    await prisma.metricSnapshot.createMany({ data: items });
  }
  return items;
}

// ── 2. Delta vs snapshot anterior ──────────────────────
async function withDeltas(items) {
  const today = startOfToday();
  const out = [];
  for (const it of items) {
    const prev = await prisma.metricSnapshot.findFirst({
      where: { metric: it.metric, capturedAt: { lt: today } },
      orderBy: { capturedAt: 'desc' },
    });
    const delta = prev ? it.value - prev.value : null;
    out.push({ ...it, delta, status: delta != null && delta < 0 ? 'abaixo' : 'normal' });
  }
  return out;
}

// ── runDailyReport: orquestra tudo ─────────────────────
async function runDailyReport() {
  console.log('[dailyReport] iniciando captura...');
  const captured = await captureMetrics();

  if (captured.length === 0) {
    console.warn('[dailyReport] nenhuma métrica capturada — fontes fora do ar.');
  }

  const withDelta = await withDeltas(captured);

  // Resumo via FERB (Claude). Se falhar, texto neutro.
  let summary;
  try {
    summary = withDelta.length
      ? await ferb.gerarSummary(withDelta)
      : 'Sem dados das fontes externas hoje. O FERB não conseguiu ler os números — verifique as integrações.';
  } catch (e) {
    console.error('[dailyReport] gerarSummary falhou:', e.message);
    summary = 'Relatório capturado, mas a leitura do FERB não pôde ser gerada agora.';
  }

  const status = withDelta.length ? ferb.gerarStatusGeral(withDelta) : 'warning';

  const today = startOfToday();
  const metricsJson = JSON.stringify(
    withDelta.map(m => ({ source: m.source, label: m.label, value: m.value, delta: m.delta }))
  );

  const report = await prisma.dailyReport.upsert({
    where:  { date: today },
    update: { summary, status, metrics: metricsJson },
    create: { date: today, summary, status, metrics: metricsJson },
  });

  console.log(`[dailyReport] relatório de ${today.toISOString().slice(0, 10)} salvo (${captured.length} métricas, status ${status}).`);
  return report;
}

module.exports = { runDailyReport, captureMetrics };
