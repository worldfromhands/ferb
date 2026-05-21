const express = require('express');
const prisma  = require('../config/prisma');
const cm      = require('../services/chartmetric');
const sp      = require('../services/spotify');
const yt      = require('../services/youtube');
const ig      = require('../services/instagram');
const ferb    = require('../services/ferb');
const router  = express.Router();

async function buildReport() {
  // Dados Chartmetric + Spotify + YouTube + Instagram — tudo em paralelo
  const [
    metricChanges,
    audienceMetrics,
    identity,
    topCities,
    topCountries,
    albums,
    playlists,
    relatedCM,
    spotifySnapshot,
    youtubeSnapshot,
    instagramSnapshot,
  ] = await Promise.all([
    cm.getHomeMetrics(),
    cm.getAudienceMetrics(),
    cm.getIdentitySnapshot(),
    cm.getTopCities(undefined, 12),
    cm.getTopCountries(undefined, 8),
    cm.getAlbums(undefined, 10),
    cm.getCurrentPlaylists(undefined, 'spotify', 10),
    cm.getRelatedArtists(undefined, 8),
    sp.getSnapshot(),
    yt.getSnapshot(),
    ig.getSnapshot(),
  ]);

  const todas = [...metricChanges, ...audienceMetrics];
  const [summary, overallStatus] = await Promise.all([
    ferb.gerarSummary(todas),
    Promise.resolve(ferb.gerarStatusGeral(todas)),
  ]);

  const criticalItems = audienceMetrics
    .filter(m => m.status === 'abaixo')
    .slice(0, 3)
    .map(m => ({
      message: `${m.label}: ${(m.value ?? 0).toLocaleString('pt-BR')}${m.delta != null ? ` (${m.delta > 0 ? '+' : ''}${Number(m.delta).toLocaleString('pt-BR')})` : ''}`,
      status: m.delta != null && m.delta < -50000 ? 'critical' : 'warning',
    }));

  const pendentes = await prisma.task.findMany({
    where: { status: { not: 'feita' } },
    orderBy: { createdAt: 'asc' },
    take: 3,
  });

  return {
    summary,
    overallStatus,
    criticalItems,
    metricChanges,
    audienceMetrics,
    identity,
    topCities,
    topCountries,
    albums,
    playlists,
    relatedArtists: spotifySnapshot?.relatedArtists?.length ? spotifySnapshot.relatedArtists : relatedCM,
    spotifyTopTracks: spotifySnapshot?.topTracks || [],
    spotifyArtist:    spotifySnapshot?.artist    || null,
    spotifyConfigured: sp.isConfigured(),
    youtube: youtubeSnapshot,
    youtubeConfigured: yt.isConfigured(),
    instagram: instagramSnapshot,
    pendingTasks: pendentes.map(t => ({
      title: t.title,
      priority: t.priority === 'critica' ? 'high' : t.priority === 'alta' ? 'medium' : 'low',
    })),
    opportunities: [
      { title: 'Playlist editorial Spotify BR', description: 'Perfil bate com "Novas Vozes do Rap".' },
      { title: 'Deal EP com Loud',               description: 'Aguardando resposta. Prazo: sexta.' },
    ],
    generatedAt: new Date().toISOString(),
  };
}

router.get('/:artistId', async (req, res, next) => {
  try { res.json(await buildReport()); }
  catch (e) { next(e); }
});

router.post('/:artistId/refresh', async (req, res, next) => {
  try { res.json(await buildReport()); }
  catch (e) { next(e); }
});

module.exports = router;
