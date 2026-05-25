/**
 * Ingere o pacote de CSVs do YouTube/Spotify exportados pelo usuário.
 *
 *  Atenção: os nomes de arquivo NÃO batem com o conteúdo (export bagunçado).
 *  O conteúdo real foi mapeado abaixo a partir dos cabeçalhos.
 *
 *   YouTube_Paises_Historico.csv → SPOTIFY audience timeline diário
 *   YouTube_Musicas_Historico.csv → YouTube por país (acumulado)
 *   YouTube_Tipo_Conteudo.csv     → YouTube origem do tráfego (acumulado)
 *   YouTube_Conteudo_Historico.csv→ YouTube tipo de conteúdo (acumulado)
 *   YouTube_Musicas_Tracks.csv    → YouTube community posts
 *   YouTube_Total_Geral.csv       → YouTube top tracks (acumulado)
 *   YouTube_Trafego_Historico.csv → YouTube playlists do canal
 *   (timeseries por dia: Paises, Origem_Trafego, Posts_Canal,
 *    Conteudo_Videos, Playlists_Canal — não importadas aqui)
 *
 *  Saídas:
 *   1. Upsert de DailyMetric (uma linha por dia desde jan/2024) com os
 *      campos Spotify reais (listeners, streams, playlist_adds, saves, etc).
 *   2. data/youtube-analytics.json com os agregados YouTube prontos pra
 *      injetar nos agentes e expor via /api/youtube-analytics.
 */

const fs   = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const prisma = require('../src/config/prisma');

const TEMP = 'C:/Users/Kyan/AppData/Local/Temp';
const OUT_JSON = path.join(__dirname, '..', 'src', 'data', 'youtube-analytics.json');

function readCsv(file, opts = {}) {
  const buf = fs.readFileSync(path.join(TEMP, file));
  // remove BOM
  const text = buf.toString('utf8').replace(/^﻿/, '');
  return parse(text, { columns: true, skip_empty_lines: true, trim: true, ...opts });
}

const toInt   = (v) => { const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10); return Number.isFinite(n) ? n : null; };
const toFloat = (v) => { const n = parseFloat(String(v).replace(/[^\d.\-]/g, '')); return Number.isFinite(n) ? n : null; };

// ── 1. Spotify daily timeline ────────────────────────────────
async function importSpotifyTimeline() {
  console.log('▸ Spotify timeline (YouTube_Paises_Historico.csv)...');
  const rows = readCsv('YouTube_Paises_Historico.csv');
  let n = 0, skipped = 0;
  for (const r of rows) {
    const dateStr = r.date;
    if (!dateStr || dateStr === 'Total') { skipped++; continue; }
    const date = new Date(dateStr);
    if (isNaN(date)) { skipped++; continue; }
    date.setHours(0, 0, 0, 0);

    const data = {
      spotifyListeners:        toInt(r.listeners),
      spotifyMonthlyListeners: toInt(r['monthly listeners']),
      spotifyMonthlyActive:    toInt(r['monthly active listeners']),
      spotifySuperListeners:   toInt(r['super listeners']),
      spotifyStreams:          toInt(r.streams),
      spotifyPlaylistAdds:     toInt(r['playlist adds']),
      spotifySaves:            toInt(r.saves),
      spotifyFollowers:        toInt(r.followers),
      source: 'csv',
    };

    await prisma.dailyMetric.upsert({
      where:  { date },
      update: data,
      create: { date, ...data },
    });
    n++;
  }
  console.log(`  ${n} dias importados, ${skipped} linhas puladas.`);
  return n;
}

// ── 2. YouTube agregados → snapshot JSON ──────────────────────
function buildYoutubeSnapshot() {
  console.log('▸ Montando snapshot YouTube (agregados)...');

  // Total geral (vem da primeira linha de Total em quase todos os arquivos)
  const tracksCsv = readCsv('YouTube_Total_Geral.csv');
  const totalRow = tracksCsv.find(r => r.Track === 'Total');
  const totalViews  = toInt(totalRow?.['Visualizações']) || 860443719;
  const totalHours  = toFloat(totalRow?.['Tempo de exibição (horas)']) || 36555524;
  const avgDuration = totalRow?.['Duração média da visualização'] || '0:02:34';

  // Top tracks (filtra Total e linhas com 0)
  const topTracks = tracksCsv
    .filter(r => r.Track !== 'Total' && toInt(r['Visualizações']) > 0)
    .slice(0, 50)
    .map(r => ({
      title: r['Título da música'] || '(sem título)',
      views: toInt(r['Visualizações']),
      watchHours: toFloat(r['Tempo de exibição (horas)']),
      avgDuration: r['Duração média da visualização'],
    }));

  // Top países
  const countriesCsv = readCsv('YouTube_Musicas_Historico.csv');
  const topCountries = countriesCsv
    .filter(r => r['País'] !== 'Total' && toInt(r['Visualizações']) > 0)
    .slice(0, 30)
    .map(r => ({
      code: r['País'],
      views: toInt(r['Visualizações']),
      watchHours: toFloat(r['Tempo de exibição (horas)']),
      share: ((toInt(r['Visualizações']) / totalViews) * 100).toFixed(2) + '%',
    }));

  // Origem de tráfego
  const trafficCsv = readCsv('YouTube_Tipo_Conteudo.csv');
  const trafficSources = trafficCsv
    .filter(r => r['Origem do tráfego'] !== 'Total' && toInt(r['Visualizações']) > 0)
    .map(r => ({
      source: r['Origem do tráfego'],
      views: toInt(r['Visualizações']),
      watchHours: toFloat(r['Tempo de exibição (horas)']),
      share: ((toInt(r['Visualizações']) / totalViews) * 100).toFixed(2) + '%',
    }));

  // Tipo de conteúdo (vídeos longos vs shorts vs lives)
  const contentCsv = readCsv('YouTube_Conteudo_Historico.csv');
  const contentSplit = {};
  for (const r of contentCsv) {
    if (r['Tipo de conteúdo'] === 'Total') continue;
    const key = r['Tipo de conteúdo'].toLowerCase().includes('short') ? 'shorts'
              : r['Tipo de conteúdo'].toLowerCase().includes('ao vivo') ? 'lives'
              : 'videos';
    contentSplit[key] = {
      views: toInt(r['Visualizações']),
      watchHours: toFloat(r['Tempo de exibição (horas)']),
      avgDuration: r['Duração média da visualização'],
      share: ((toInt(r['Visualizações']) / totalViews) * 100).toFixed(2) + '%',
    };
  }

  // Playlists do canal
  const playlistsCsv = readCsv('YouTube_Trafego_Historico.csv');
  const playlists = playlistsCsv
    .filter(r => r['Playlist'] !== 'Total' && toInt(r['Visualizações de playlists']) > 0)
    .map(r => ({
      id: r['Playlist'],
      title: r['Título da playlist'],
      views: toInt(r['Visualizações de playlists']),
      watchHours: toFloat(r['Tempo de exibição da playlist (em horas)']),
      starts: toInt(r['Inícios da playlist']),
      likes: toInt(r['Playlist marcadas como "Gostei"']),
    }));

  // Community posts (top por impressões)
  const postsCsv = readCsv('YouTube_Musicas_Tracks.csv');
  const topPosts = postsCsv
    .filter(r => r['Postar'] !== 'Total' && toInt(r['Impressões do post']) > 0)
    .slice(0, 25)
    .map(r => ({
      id: r['Postar'],
      text: (r['Texto do post'] || '').slice(0, 200),
      publishedAt: r['Horário de publicação do post'],
      impressions: toInt(r['Impressões do post']),
      likes: toInt(r['"Gostei" do post']),
      likeRate: toFloat(r['Média de "Gostei" do post (%)']),
    }));

  const snapshot = {
    meta: {
      capturedAt: new Date().toISOString(),
      source: 'YouTube Studio CSV export (bundle 25/05/2026)',
      note: 'Snapshot agregado. Timeseries diárias ficam no DailyMetric / fora deste arquivo.',
    },
    summary: {
      totalViews,
      totalWatchHours: totalHours,
      avgDuration,
    },
    topTracks,
    topCountries,
    trafficSources,
    contentSplit,
    playlists,
    topPosts,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(snapshot, null, 2));
  console.log(`  snapshot salvo em ${OUT_JSON}`);
  console.log(`  ${topTracks.length} tracks, ${topCountries.length} países, ${trafficSources.length} fontes, ${playlists.length} playlists, ${topPosts.length} posts.`);
  return snapshot;
}

(async () => {
  try {
    const days = await importSpotifyTimeline();
    const snap = buildYoutubeSnapshot();
    console.log(`\n✓ Bundle ingerido — ${days} dias Spotify + agregados YouTube prontos.`);
  } catch (e) {
    console.error('ERRO:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
