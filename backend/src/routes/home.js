const express = require('express');
const cm      = require('../services/chartmetric');
const sp      = require('../services/spotify');
const ferb    = require('../services/ferb');
const router  = express.Router();

let tasks = [
  { id: '1', title: 'Gravar a voz do Bloco 2',  status: 'todo', priority: 'critica', ferb: true  },
  { id: '2', title: 'Responder e-mail da Loud',  status: 'todo', priority: 'alta',   ferb: true  },
  { id: '3', title: 'Postar reels da sessao',    status: 'todo', priority: 'media',  ferb: false },
  { id: '4', title: 'Revisar contrato Spotify',  status: 'todo', priority: 'media',  ferb: false },
  { id: '5', title: 'Checar ISRC das faixas',    status: 'feita', priority: 'baixa', ferb: false },
];
module.exports.tasks = tasks;

async function buildReport() {
  // Dados Chartmetric — tudo em paralelo
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

  const pendentes = tasks.filter(t => t.status !== 'feita').slice(0, 3);

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
module.exports.tasks = tasks;
