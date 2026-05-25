/**
 * Cada agente recebe um CONTEXTO REAL do KYAN baseado nos dados do Chartmetric + Spotify
 * antes de processar uma demanda. Assim ele responde com informação concreta, não chute.
 *
 * RESILIÊNCIA: cada fonte de dado é isolada com safe(). Se o Chartmetric cair (ex.: cota
 * esgotada / 402), os dados do Spotify continuam chegando — e vice-versa. Uma falha parcial
 * nunca zera o contexto inteiro.
 */

const cm = require('../services/chartmetric');
const sp = require('../services/spotify');
const { getCatalog } = require('../services/catalog');
const yta = require('../services/youtubeAnalytics');

function fmt(n) {
  if (n == null) return '?';
  return Number(n).toLocaleString('pt-BR');
}

// ── CATÁLOGO (snapshot Spotify for Artists) — fonte local, nunca falha ──
const catTopSongs = (n = 10) =>
  (getCatalog().topSongs || []).slice(0, n).map(s => `${s.rank}. ${s.title} — ${fmt(s.streams)} streams`).join('\n');
const catDiscography = () =>
  (getCatalog().albums || []).map(a => `- ${a.title} (${a.type}) — ${fmt(a.streams)} streams`).join('\n');
const catAlbumAnalysis = () =>
  (getCatalog().albumAnalysis || []).map(a =>
    `- ${a.title}: ${fmt(a.streams12m)} streams/12m, ${fmt(a.listeners12m)} ouvintes, crescimento ${a.growthStreams}`
  ).join('\n');
const catGeography = () => {
  const g = getCatalog().geography || {};
  const paises  = (g.topCountries || []).map(p => `${p.country} ${fmt(p.streams)}`).join(' · ');
  const cidades = (g.topCities || []).map(c => `${c.city} ${fmt(c.streams)}`).join(' · ');
  return `Países (28d): ${paises}\nCidades (28d): ${cidades}`;
};
const catPlaylists = () =>
  (getCatalog().playlists?.byReach || []).slice(0, 8)
    .map(p => `- ${p.name}${p.editorial ? ' [editorial]' : ''} — reach ${fmt(p.reach)}`).join('\n');
const CAT_NOTE = 'Fonte: Spotify for Artists, snapshot manual de 22/05/2026 (não atualiza sozinho).';

// ── YOUTUBE — snapshot agregado do export YouTube Studio ──
const YT_NOTE = 'Fonte: YouTube Studio CSV export (25/05/2026). Agregado acumulado.';
function ytBlock(kind) {
  const s = yta.summary();
  if (!s) return '';

  const header = `\n\nYOUTUBE — AGREGADO ACUMULADO:\n- Total: ${fmt(s.totalViews)} views · ${fmt(Math.round(s.totalWatchHours))}h assistidas · duração média ${s.avgDuration}\n`;

  const blocks = {
    manager: () => {
      const cs = yta.contentSplit();
      const countries = yta.topCountries(5);
      const tracks = yta.topTracks(5);
      return header
        + `Split: vídeos longos ${cs.videos?.share || '?'} · Shorts ${cs.shorts?.share || '?'}\n`
        + `Top países: ${countries.map(c => `${c.code} ${fmt(c.views)} (${c.share})`).join(' · ')}\n`
        + `Top tracks YouTube: ${tracks.map(t => `${t.title} ${fmt(t.views)}`).join(' · ')}\n${YT_NOTE}`;
    },
    marketer: () => {
      const src = yta.trafficSources().slice(0, 6);
      const posts = yta.topPosts(4);
      return header
        + `Origem de tráfego:\n${src.map(t => `- ${t.source}: ${fmt(t.views)} (${t.share})`).join('\n')}\n`
        + `Posts da comunidade com mais alcance:\n${posts.map(p => `- "${p.text.slice(0, 60)}" — ${fmt(p.impressions)} impressões / ${fmt(p.likes)} likes (${p.likeRate}%)`).join('\n')}\n${YT_NOTE}`;
    },
    socialmedia: () => {
      const cs = yta.contentSplit();
      const posts = yta.topPosts(5);
      const src = yta.trafficSources().slice(0, 5);
      return header
        + `Tipo de conteúdo:\n- Vídeos longos: ${fmt(cs.videos?.views)} (${cs.videos?.share})\n- Shorts: ${fmt(cs.shorts?.views)} (${cs.shorts?.share})\n`
        + `Origem de tráfego (sinais do algoritmo): ${src.map(t => `${t.source} ${t.share}`).join(' · ')}\n`
        + `Posts da comunidade com mais engajamento:\n${posts.map(p => `- "${p.text.slice(0, 70)}" — ${fmt(p.impressions)} impressões / like rate ${p.likeRate}%`).join('\n')}\n${YT_NOTE}`;
    },
    arandr: () => {
      const tracks = yta.topTracks(12);
      const playlists = yta.playlists().slice(0, 6);
      return header
        + `Top 12 tracks por views no YouTube (potencial diferente do Spotify):\n${tracks.map((t, i) => `${i+1}. ${t.title} — ${fmt(t.views)} views, ${fmt(Math.round(t.watchHours))}h`).join('\n')}\n`
        + `Playlists do canal (curadoria interna):\n${playlists.map(p => `- ${p.title}: ${fmt(p.views)} views, ${fmt(p.starts)} starts`).join('\n')}\n${YT_NOTE}`;
    },
    booking: () => {
      const countries = yta.topCountries(15);
      return header
        + `Top 15 países por views no YouTube (geografia real onde o som chega):\n${countries.map((c, i) => `${i+1}. ${c.code}: ${fmt(c.views)} views (${c.share})`).join('\n')}\n${YT_NOTE}`;
    },
    techhacker: () => {
      const src = yta.trafficSources();
      const cs = yta.contentSplit();
      const playlists = yta.playlists().slice(0, 5);
      return header
        + `Origem de tráfego completa:\n${src.map(t => `- ${t.source}: ${fmt(t.views)} (${t.share})`).join('\n')}\n`
        + `Split por formato: vídeos ${cs.videos?.share} · Shorts ${cs.shorts?.share}\n`
        + `Playlists internas com mais alcance:\n${playlists.map(p => `- ${p.title}: ${fmt(p.views)} views, ${fmt(p.starts)} starts`).join('\n')}\n${YT_NOTE}`;
    },
  };
  return (blocks[kind] || (() => ''))();
}

// Isola cada chamada — se falhar, devolve o fallback em vez de derrubar tudo.
async function safe(fn, fallback) {
  try {
    const r = await fn();
    return (r == null) ? fallback : r;
  } catch (e) {
    console.error('[agentContext] fonte indisponível:', e.response?.status || '', e.message);
    return fallback;
  }
}

const INDISP = '(dados indisponíveis no momento — fonte externa fora do ar)';

/**
 * Monta contexto específico pra cada agente, retornando uma string pra prepender no prompt.
 */
async function buildAgentContext(agentId) {
  try {
    switch (agentId) {

      // ─── GERENTE — visão macro (rank, estágio, tendência, contratos) ──
      case 'manager': {
        const [identity, metrics, related] = await Promise.all([
          safe(() => cm.getIdentitySnapshot(), null),
          safe(() => cm.getAudienceMetrics(), []),
          safe(() => cm.getRelatedArtists(undefined, 5), []),
        ]);
        const numeros = metrics.length
          ? metrics.map(m => `- ${m.label}: ${fmt(m.value)}${m.delta != null ? ` (${m.delta > 0 ? '+' : ''}${fmt(m.delta)})` : ''}`).join('\n')
          : INDISP;
        return `\n\nCONTEXTO REAL DO KYAN (dados Chartmetric):
- Ranking mundial: #${identity?.rank || '?'} (score ${identity?.score || '?'})
- Estágio de carreira: ${identity?.careerStage || '?'} (${identity?.stageScore || '?'}/100)
- Tendência: ${identity?.trend || '?'} (score ${identity?.trendScore || '?'}/100)
- Gênero principal: ${identity?.primaryGenre || '?'}
- Hometown: ${identity?.hometown || '?'}
- Record label: ${identity?.recordLabel || 'independente'}
- Booking: ${identity?.booking || 'sem agência'}

NÚMEROS ATUAIS:
${numeros}

ARTISTAS SIMILARES (concorrência direta): ${related.length ? related.slice(0,5).map(r => r.name).join(', ') : INDISP}

CATÁLOGO — DESEMPENHO REAL (Spotify for Artists):
Top músicas por streams:
${catTopSongs(6)}
Discografia (streams totais):
${catDiscography()}
Análise dos álbuns (12 meses):
${catAlbumAnalysis()}
${CAT_NOTE}${ytBlock('manager')}`;
      }

      // ─── PRODUTOR — catálogo, lançamentos, tracks ──
      case 'musicproducer': {
        const [albums, spotifySnap, related] = await Promise.all([
          safe(() => cm.getAlbums(undefined, 10), []),
          safe(() => sp.getSnapshot(), null),
          safe(() => cm.getRelatedArtists(undefined, 6), []),
        ]);
        const recentReleases = (albums || []).slice(0, 6).map(a => `- ${a.name} (${a.release_date || '?'})`).join('\n');
        const tracks = (spotifySnap?.topTracks || []).slice(0, 8).map(t => `- ${t.name} (álbum: ${t.album || '?'})`).join('\n');
        const latest = (spotifySnap?.latestAlbumTracks || []).slice(0, 10).map(t => `- ${t.name}`).join('\n');
        return `\n\nCATÁLOGO REAL DO KYAN (Chartmetric + Spotify):

LANÇAMENTOS RECENTES:
${recentReleases || INDISP}

FAIXAS NO SPOTIFY (busca):
${tracks || INDISP}

FAIXAS DO ÁLBUM MAIS RECENTE:
${latest || INDISP}

ARTISTAS SIMILARES (referência sonora): ${related.length ? related.slice(0,6).map(r => r.name).join(', ') : INDISP}

TOP MÚSICAS POR STREAMS (Spotify for Artists — o que de fato performa):
${catTopSongs(10)}
${CAT_NOTE}`;
      }

      // ─── MARKETER — redes sociais, demografia, geografia, identidade ──
      case 'marketer': {
        const [identity, ig, tt, topCities] = await Promise.all([
          safe(() => cm.getIdentitySnapshot(), null),
          safe(() => cm.getInstagramStats(), null),
          safe(() => cm.getTikTokStats(), null),
          safe(() => cm.getTopCities(undefined, 8), []),
        ]);
        const cidades = topCities.length
          ? topCities.map((c, i) => `${i + 1}. ${c.name}: ${fmt(c.listeners)} ouvintes mensais`).join('\n')
          : INDISP;
        return `\n\nPRESENÇA DIGITAL ATUAL DO KYAN:
- Instagram: ${fmt(ig?.followers?.[0]?.value)} seguidores (${ig?.followers?.[0]?.weekly_diff != null ? `${ig.followers[0].weekly_diff > 0 ? '+' : ''}${fmt(ig.followers[0].weekly_diff)} essa semana` : '?'})
- TikTok: ${fmt(tt?.followers?.[0]?.value)} seguidores, ${fmt(tt?.likes?.[0]?.value)} likes acumulados
- Hometown: ${identity?.hometown || '?'}
- Gênero principal: ${identity?.primaryGenre || '?'}
- Moods do artista: ${identity?.moods?.join(', ') || '?'}
- Atividades: ${identity?.activities?.join(', ') || '?'}

CIDADES DE AUDIÊNCIA (onde já há base de ouvintes):
${cidades}

GEOGRAFIA POR STREAMS (Spotify for Artists):
${catGeography()}

PLAYLISTS POR ALCANCE (onde o KYAN aparece):
${catPlaylists()}
${CAT_NOTE}${ytBlock('marketer')}`;
      }

      // ─── A&R — catálogo, faixas, playlists, gêneros, artistas próximos ──
      case 'arandr': {
        const [playlists, identity, related, spotifySnap] = await Promise.all([
          safe(() => cm.getCurrentPlaylists(undefined, 'spotify', 8), []),
          safe(() => cm.getIdentitySnapshot(), null),
          safe(() => cm.getRelatedArtists(undefined, 8), []),
          safe(() => sp.getSnapshot(), null),
        ]);
        const plList = (playlists || []).slice(0, 6).map(p => `- ${p.name || p.playlist_name || '?'} (${fmt(p.followers)} followers)`).join('\n');
        const albuns = (spotifySnap?.albums || []).slice(0, 10).map(a => `- ${a.name} (${a.releaseDate || '?'}, ${a.totalTracks || '?'} faixas)`).join('\n');
        const tracks = (spotifySnap?.topTracks || []).slice(0, 8).map(t => `- ${t.name} (álbum: ${t.album || '?'})`).join('\n');
        const latest = (spotifySnap?.latestAlbumTracks || []).slice(0, 10).map(t => `- ${t.name}`).join('\n');
        return `\n\nCONTEXTO DE MERCADO DO KYAN:
- Gênero principal: ${identity?.primaryGenre || '?'}
- Subgêneros: ${identity?.secondaryGenres?.join(', ') || '?'}
- Estágio: ${identity?.careerStage || '?'} | Tendência: ${identity?.trend || '?'}

DISCOGRAFIA REAL NO SPOTIFY:
${albuns || INDISP}

FAIXAS DO KYAN (busca Spotify):
${tracks || INDISP}

FAIXAS DO ÁLBUM MAIS RECENTE:
${latest || INDISP}

PLAYLISTS ONDE KYAN ESTÁ HOJE:
${plList || INDISP}

ARTISTAS SIMILARES (referências de mercado): ${related.length ? related.slice(0,6).map(r => r.name).join(', ') : INDISP}

TOP MÚSICAS POR STREAMS REAIS (Spotify for Artists):
${catTopSongs(10)}

DISCOGRAFIA POR STREAMS:
${catDiscography()}

ANÁLISE DOS ÁLBUNS (12 meses — crescimento/queda):
${catAlbumAnalysis()}

PLAYLISTS POR ALCANCE:
${catPlaylists()}

${CAT_NOTE} Use estes streams reais para escolher faixas — nunca invente títulos nem números fora desta lista.${ytBlock('arandr')}`;
      }

      // ─── ADVOGADO — record label, status, discografia ──
      case 'legal': {
        const [identity, spotifySnap] = await Promise.all([
          safe(() => cm.getIdentitySnapshot(), null),
          safe(() => sp.getSnapshot(), null),
        ]);
        const albuns = (spotifySnap?.albums || []).slice(0, 10).map(a => `- ${a.name} (${a.releaseDate || '?'})`).join('\n');
        return `\n\nDADOS CONTRATUAIS DO KYAN:
- Record label registrado: ${identity?.recordLabel || 'independente'}
- Booking agent: ${identity?.booking || 'sem agência'}
- Ranking mundial: #${identity?.rank || '?'}
- Estágio: ${identity?.careerStage || '?'}

DISCOGRAFIA REAL (lançamentos que geram royalties/publishing):
${albuns || INDISP}

STREAMS REAIS POR ÁLBUM (base para cálculo de royalties — Spotify for Artists):
${catDiscography()}

NOTA: Você tem os streams acima, mas NÃO tem os splits/contratos individuais nem as taxas exatas. Use os streams para dimensionar o valor em jogo; sobre splits e contratos, fale de forma estrutural e diga o que precisa ser levantado. ${CAT_NOTE}`;
      }

      // ─── FINANCEIRO — streams, audiência, ROI estimado ──
      case 'finance': {
        const [metrics, identity] = await Promise.all([
          safe(() => cm.getAudienceMetrics(), []),
          safe(() => cm.getIdentitySnapshot(), null),
        ]);
        const listeners = metrics.find(m => m.label === 'Monthly Listeners')?.value || 0;
        const streamsMonth    = Math.round(listeners * 1.8);   // ~1.8 streams por listener
        const revenueMonthUSD = Math.round(streamsMonth * 0.003); // ~$0.003/stream Spotify
        const numeros = metrics.length
          ? metrics.map(m => `- ${m.label}: ${fmt(m.value)}${m.delta != null ? ` (${m.delta > 0 ? '+' : ''}${fmt(m.delta)})` : ''}`).join('\n')
          : INDISP;
        return `\n\nINDICADORES FINANCEIROS DO KYAN:
${numeros}

ESTIMATIVAS (referência, não exatas):
- Streams/mês Spotify estimados: ${listeners ? fmt(streamsMonth) : '?'}
- Receita bruta Spotify estimada: ${listeners ? `USD ${fmt(revenueMonthUSD)}/mês` : '?'}
- Estágio de carreira: ${identity?.careerStage || '?'} (afeta cachê e deals)

STREAMS REAIS DO CATÁLOGO (Spotify for Artists — base para royalties, ~USD 0,003-0,005/stream):
${catDiscography()}
Análise por álbum (12 meses):
${catAlbumAnalysis()}
${CAT_NOTE}`;
      }

      // ─── BOOKING — geografia, cidades top ──
      case 'booking': {
        const [topCities, identity] = await Promise.all([
          safe(() => cm.getTopCities(undefined, 10), []),
          safe(() => cm.getIdentitySnapshot(), null),
        ]);
        const cidades = topCities.length
          ? topCities.map((c, i) => `${i + 1}. ${c.name}: ${fmt(c.listeners)} ouvintes mensais`).join('\n')
          : INDISP;
        return `\n\nGEOGRAFIA DE AUDIÊNCIA DO KYAN (onde fazer shows):
${cidades}

Hometown: ${identity?.hometown || '?'}
Estágio: ${identity?.careerStage || '?'} (impacta cachê médio)

STREAMS POR GEOGRAFIA (Spotify for Artists — onde a demanda real está):
${catGeography()}
${CAT_NOTE}${ytBlock('booking')}`;
      }

      // ─── ESTILISTA — moods, atividades, identidade visual, público ──
      case 'stylist': {
        const [identity, topCities] = await Promise.all([
          safe(() => cm.getIdentitySnapshot(), null),
          safe(() => cm.getTopCities(undefined, 6), []),
        ]);
        const cidades = topCities.length
          ? topCities.map((c, i) => `${i + 1}. ${c.name}: ${fmt(c.listeners)} ouvintes`).join('\n')
          : INDISP;
        return `\n\nIDENTIDADE ARTÍSTICA REGISTRADA DO KYAN:
- Gênero principal: ${identity?.primaryGenre || '?'}
- Subgêneros: ${identity?.secondaryGenres?.join(', ') || '?'}
- Moods do artista: ${identity?.moods?.join(', ') || '?'}
- Atividades: ${identity?.activities?.join(', ') || '?'}
- Hometown: ${identity?.hometown || '?'}
- Descrição: ${identity?.description?.slice(0, 200) || '?'}

CIDADES DO PÚBLICO (onde a estética precisa ressoar):
${cidades}

NOTA: Use o hometown e as cidades reais acima. Nunca invente origem, bairro ou cidade do artista que não esteja listado.`;
      }

      // ─── TECH HACKER — todos os dados algorítmicos ──
      case 'techhacker': {
        const [metrics, identity, topCities] = await Promise.all([
          safe(() => cm.getAudienceMetrics(), []),
          safe(() => cm.getIdentitySnapshot(), null),
          safe(() => cm.getTopCities(undefined, 5), []),
        ]);
        const get = (label) => metrics.find(m => m.label === label)?.value;
        const followers = get('Spotify Followers') || 0;
        const monthly   = get('Monthly Listeners') || 0;
        const conv      = monthly ? ((followers / monthly) * 100).toFixed(1) + '%' : '?';
        const ttRatio   = get('TikTok (seg.)') ? ((get('TikTok Likes') || 0) / get('TikTok (seg.)')).toFixed(1) + 'x' : '?';
        return `\n\nDIAGNÓSTICO ALGORÍTMICO DO KYAN:
- Spotify Popularity Score: ${get('Popularidade Spotify') ?? '?'}/100
- Monthly Listeners: ${fmt(get('Monthly Listeners'))}
- Spotify Followers: ${fmt(get('Spotify Followers'))}
- Conversão (followers/listeners): ${conv}
- Instagram: ${fmt(get('Instagram (seg.)'))} (delta ${metrics.find(m => m.label === 'Instagram (seg.)')?.delta ?? '?'})
- TikTok likes/seguidor ratio: ${ttRatio}
- CM rank: #${identity?.rank || '?'} | Trend: ${identity?.trend || '?'}
- Top 5 cidades: ${topCities.length ? topCities.map(c => c.name).join(', ') : INDISP}${ytBlock('techhacker')}`;
      }

      // ─── SOCIAL MEDIA — Instagram/TikTok/YouTube, conteúdo, timing ──
      case 'socialmedia': {
        const [identity, ig, tt, ytStats] = await Promise.all([
          safe(() => cm.getIdentitySnapshot(), null),
          safe(() => cm.getInstagramStats(), null),
          safe(() => cm.getTikTokStats(), null),
          safe(() => require('../services/youtube').getChannelStats(), null),
        ]);
        const igFollowers = ig?.followers?.[0]?.value;
        const igDelta     = ig?.followers?.[0]?.weekly_diff;
        const ttFollowers = tt?.followers?.[0]?.value;
        const ttLikes     = tt?.likes?.[0]?.value;
        const ttRatio     = (ttFollowers && ttLikes) ? (ttLikes / ttFollowers).toFixed(1) + 'x likes/seguidor' : '?';

        return `\n\nPRESENÇA DO KYAN NAS REDES (números reais):
- Instagram: ${fmt(igFollowers)} seguidores${igDelta != null ? ` (${igDelta > 0 ? '+' : ''}${fmt(igDelta)} essa semana)` : ''}
- TikTok: ${fmt(ttFollowers)} seguidores · ${fmt(ttLikes)} likes acumulados · ${ttRatio}
- YouTube: ${fmt(ytStats?.subscribers)} inscritos · ${fmt(ytStats?.views)} views totais · ${fmt(ytStats?.videos)} vídeos
- Gênero/cena: ${identity?.primaryGenre || '?'} · subgêneros: ${identity?.secondaryGenres?.join(', ') || '?'}
- Moods do artista: ${identity?.moods?.join(', ') || '?'}

GEOGRAFIA REAL (onde o conteúdo precisa ressoar):
${catGeography()}

ONDE O KYAN JÁ APARECE (playlists por alcance):
${catPlaylists()}

CATÁLOGO QUE ESTÁ PERFORMANDO (top streams — base do conteúdo viável):
${catTopSongs(6)}

NOTA: O FERB não tem acesso direto a trending topics em tempo real nem Instagram Creator/Insights. Mas agora você TEM o YouTube Studio agregado (abaixo) com tráfego, posts da comunidade e split de conteúdo — use isso pra fundamentar timing e formato.
${CAT_NOTE}${ytBlock('socialmedia')}`;
      }
    }
  } catch (e) {
    console.error('[agentContext] erro inesperado', agentId, e.message);
  }
  return '';
}

module.exports = { buildAgentContext };
