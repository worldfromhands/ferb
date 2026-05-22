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

function fmt(n) {
  if (n == null) return '?';
  return Number(n).toLocaleString('pt-BR');
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

ARTISTAS SIMILARES (concorrência direta): ${related.length ? related.slice(0,5).map(r => r.name).join(', ') : INDISP}`;
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

ARTISTAS SIMILARES (referência sonora): ${related.length ? related.slice(0,6).map(r => r.name).join(', ') : INDISP}`;
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
${cidades}`;
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

NOTA: o Spotify não expõe streams/popularidade por faixa neste plano. Use os nomes reais de faixa/álbum acima — nunca invente títulos. Para escolher uma faixa, raciocine pela posição no catálogo, recência e encaixe de playlist.`;
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

NOTA: Você NÃO tem dados de streams por faixa nem de splits/contratos individuais. Fale sobre os riscos de forma estrutural — nunca cite números de streams nem nomes de faixas que não estejam na discografia acima. Se um dado contratual não está aqui, diga que precisa ser levantado.`;
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
- Estágio de carreira: ${identity?.careerStage || '?'} (afeta cachê e deals)`;
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
Estágio: ${identity?.careerStage || '?'} (impacta cachê médio)`;
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
- Top 5 cidades: ${topCities.length ? topCities.map(c => c.name).join(', ') : INDISP}`;
      }
    }
  } catch (e) {
    console.error('[agentContext] erro inesperado', agentId, e.message);
  }
  return '';
}

module.exports = { buildAgentContext };
