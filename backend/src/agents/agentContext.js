/**
 * Cada agente recebe um CONTEXTO REAL do KYAN baseado nos dados do Chartmetric + Spotify
 * antes de processar uma demanda. Assim ele responde com informação concreta, não chute.
 */

const cm = require('../services/chartmetric');
const sp = require('../services/spotify');

function fmt(n) {
  if (n == null) return '?';
  return Number(n).toLocaleString('pt-BR');
}

/**
 * Monta contexto específico pra cada agente, retornando uma string pra prepender no prompt.
 */
async function buildAgentContext(agentId) {
  try {
    switch (agentId) {

      // ─── GERENTE — visão macro (rank, estágio, tendência, contratos) ──
      case 'manager': {
        const [identity, metrics, related] = await Promise.all([
          cm.getIdentitySnapshot(),
          cm.getAudienceMetrics(),
          cm.getRelatedArtists(undefined, 5),
        ]);
        return `\n\nCONTEXTO REAL DO KYAN (dados Chartmetric):
- Ranking mundial: #${identity?.rank || '?'} (score ${identity?.score || '?'})
- Estágio de carreira: ${identity?.careerStage || '?'} (${identity?.stageScore || '?'}/100)
- Tendência: ${identity?.trend || '?'} (score ${identity?.trendScore || '?'}/100)
- Gênero principal: ${identity?.primaryGenre || '?'}
- Hometown: ${identity?.hometown || '?'}
- Record label: ${identity?.recordLabel || 'independente'}
- Booking: ${identity?.booking || 'sem agência'}

NÚMEROS ATUAIS:
${metrics.map(m => `- ${m.label}: ${fmt(m.value)}${m.delta != null ? ` (${m.delta > 0 ? '+' : ''}${fmt(m.delta)})` : ''}`).join('\n')}

ARTISTAS SIMILARES (concorrência direta): ${related.slice(0,5).map(r => r.name).join(', ')}`;
      }

      // ─── PRODUTOR — catálogo, lançamentos, tracks top ──
      case 'musicproducer': {
        const [albums, spotifySnap] = await Promise.all([
          cm.getAlbums(undefined, 10),
          sp.getSnapshot(),
        ]);
        const recentReleases = (albums || []).slice(0, 6).map(a => `- ${a.name} (${a.release_date || '?'})`).join('\n');
        const topTracks = (spotifySnap?.topTracks || []).slice(0, 5).map(t => `- ${t.name} (popularidade ${t.popularity})`).join('\n');
        return `\n\nCATÁLOGO REAL DO KYAN (Chartmetric + Spotify):

LANÇAMENTOS RECENTES:
${recentReleases || '(sem dados)'}

TOP TRACKS NO SPOTIFY:
${topTracks || '(Spotify API ainda não configurada)'}`;
      }

      // ─── MARKETER — redes sociais, demografia, identidade ──
      case 'marketer': {
        const [identity, ig, tt] = await Promise.all([
          cm.getIdentitySnapshot(),
          cm.getInstagramStats(),
          cm.getTikTokStats(),
        ]);
        return `\n\nPRESENÇA DIGITAL ATUAL DO KYAN:
- Instagram: ${fmt(ig?.followers?.[0]?.value)} seguidores (${ig?.followers?.[0]?.weekly_diff != null ? `${ig.followers[0].weekly_diff > 0 ? '+' : ''}${fmt(ig.followers[0].weekly_diff)} essa semana` : '?'})
- TikTok: ${fmt(tt?.followers?.[0]?.value)} seguidores, ${fmt(tt?.likes?.[0]?.value)} likes acumulados
- Hometown: ${identity?.hometown || '?'}
- Gênero principal: ${identity?.primaryGenre || '?'}
- Moods do artista: ${identity?.moods?.join(', ') || '?'}
- Atividades: ${identity?.activities?.join(', ') || '?'}`;
      }

      // ─── A&R — playlists, gêneros, artistas próximos ──
      case 'arandr': {
        const [playlists, identity, related] = await Promise.all([
          cm.getCurrentPlaylists(undefined, 'spotify', 8),
          cm.getIdentitySnapshot(),
          cm.getRelatedArtists(undefined, 8),
        ]);
        const plList = (playlists || []).slice(0, 6).map(p => `- ${p.name || p.playlist_name || '?'} (${fmt(p.followers)} followers)`).join('\n');
        return `\n\nCONTEXTO DE MERCADO DO KYAN:
- Gênero principal: ${identity?.primaryGenre || '?'}
- Subgêneros: ${identity?.secondaryGenres?.join(', ') || '?'}
- Estágio: ${identity?.careerStage || '?'} | Tendência: ${identity?.trend || '?'}

PLAYLISTS ONDE KYAN ESTÁ HOJE:
${plList || '(sem dados)'}

ARTISTAS SIMILARES (referências de mercado): ${related.slice(0,6).map(r => r.name).join(', ')}`;
      }

      // ─── ADVOGADO — record label, isni, status ──
      case 'legal': {
        const identity = await cm.getIdentitySnapshot();
        return `\n\nDADOS CONTRATUAIS DO KYAN:
- Record label registrado: ${identity?.recordLabel || 'independente'}
- Booking agent: ${identity?.booking || 'sem agência'}
- Ranking mundial: #${identity?.rank || '?'}
- Estágio: ${identity?.careerStage || '?'}

(Observação: posição negocial determinada pelo estágio e tendência atuais.)`;
      }

      // ─── FINANCEIRO — streams, audiência, ROI estimado ──
      case 'finance': {
        const [metrics, identity] = await Promise.all([
          cm.getAudienceMetrics(),
          cm.getIdentitySnapshot(),
        ]);
        const listeners = metrics.find(m => m.label === 'Monthly Listeners')?.value || 0;
        // Streams/mês estimados (média 1.8 streams por listener)
        const streamsMonth  = Math.round(listeners * 1.8);
        const revenueMonthUSD = Math.round(streamsMonth * 0.003); // ~$0.003/stream Spotify
        return `\n\nINDICADORES FINANCEIROS DO KYAN:
${metrics.map(m => `- ${m.label}: ${fmt(m.value)}${m.delta != null ? ` (${m.delta > 0 ? '+' : ''}${fmt(m.delta)})` : ''}`).join('\n')}

ESTIMATIVAS (referência, não exatas):
- Streams/mês Spotify estimados: ${fmt(streamsMonth)}
- Receita bruta Spotify estimada: USD ${fmt(revenueMonthUSD)}/mês
- Estágio de carreira: ${identity?.careerStage || '?'} (afeta cachê e deals)`;
      }

      // ─── BOOKING — geografia, cidades top ──
      case 'booking': {
        const [topCities, identity] = await Promise.all([
          cm.getTopCities(undefined, 10),
          cm.getIdentitySnapshot(),
        ]);
        return `\n\nGEOGRAFIA DE AUDIÊNCIA DO KYAN (onde fazer shows):
${topCities.map((c, i) => `${i + 1}. ${c.name}: ${fmt(c.listeners)} ouvintes mensais`).join('\n')}

Hometown: ${identity?.hometown || '?'}
Estágio: ${identity?.careerStage || '?'} (impacta cachê médio)`;
      }

      // ─── ESTILISTA — moods, atividades, identidade visual ──
      case 'stylist': {
        const identity = await cm.getIdentitySnapshot();
        return `\n\nIDENTIDADE ARTÍSTICA REGISTRADA DO KYAN:
- Gênero principal: ${identity?.primaryGenre || '?'}
- Subgêneros: ${identity?.secondaryGenres?.join(', ') || '?'}
- Moods do artista: ${identity?.moods?.join(', ') || '?'}
- Atividades: ${identity?.activities?.join(', ') || '?'}
- Hometown: ${identity?.hometown || '?'}
- Descrição: ${identity?.description?.slice(0, 200) || '?'}`;
      }

      // ─── TECH HACKER — todos os dados algorítmicos ──
      case 'techhacker': {
        const [metrics, identity, topCities, fanmetrics] = await Promise.all([
          cm.getAudienceMetrics(),
          cm.getIdentitySnapshot(),
          cm.getTopCities(undefined, 5),
          cm.getFanmetrics(),
        ]);
        return `\n\nDIAGNÓSTICO ALGORÍTMICO DO KYAN:
- Spotify Popularity Score: ${metrics.find(m => m.label === 'Popularidade Spotify')?.value || '?'}/100
- Monthly Listeners: ${fmt(metrics.find(m => m.label === 'Monthly Listeners')?.value)}
- Spotify Followers: ${fmt(metrics.find(m => m.label === 'Spotify Followers')?.value)}
- Conversão (followers/listeners): ${(((metrics.find(m=>m.label==='Spotify Followers')?.value || 0) / Math.max(1, metrics.find(m=>m.label==='Monthly Listeners')?.value || 1)) * 100).toFixed(1)}%
- Instagram: ${fmt(metrics.find(m => m.label === 'Instagram (seg.)')?.value)} (delta ${metrics.find(m => m.label === 'Instagram (seg.)')?.delta || 0})
- TikTok likes/seguidor ratio: ${(((metrics.find(m=>m.label==='TikTok Likes')?.value || 0) / Math.max(1, metrics.find(m=>m.label==='TikTok (seg.)')?.value || 1))).toFixed(1)}x
- CM rank: #${identity?.rank || '?'} | Trend: ${identity?.trend || '?'}
- Top 5 cidades: ${topCities.map(c => c.name).join(', ')}`;
      }
    }
  } catch (e) {
    console.error('[agentContext]', agentId, e.message);
  }
  return ''; // sem contexto se falhar
}

module.exports = { buildAgentContext };
