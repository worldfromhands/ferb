/**
 * Auto-Analyzer — quando um DetectedEvent é criado, o agente responsável
 * recebe o contexto e gera uma análise estruturada (resumo + análise completa
 * + recomendações acionáveis) via Claude.
 *
 * Reusa nossa stack: claudeService.ask, AGENT_SYSTEM_PROMPTS, agentes existentes.
 */

const prisma = require('../config/prisma');
const { ask } = require('./claudeService');
const { AGENT_SYSTEM_PROMPTS } = require('../agents/agentPrompts');

// Mapeia tipo de evento -> agente do FERB (IDs reais do nosso seed)
const EVENT_TO_AGENT = {
  viral_streams:        'manager',
  spike_streams:        'techhacker',
  drop_streams:         'manager',
  viral_playlist_adds:  'arandr',
  drop_playlist_adds:   'arandr',
  follower_spike:       'marketer',
  follower_drop:        'marketer',
  super_listener_drop:  'arandr',
  yt_view_spike:        'socialmedia',
  ig_viral:             'socialmedia',
  revenue_drop:         'finance',
};

const fmt = (n) => (n == null ? '?' : Number(n).toLocaleString('pt-BR'));

// Resumo da tendência últimos 30d olhando DailyMetric
async function buildTrendSummary() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await prisma.dailyMetric.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'desc' },
    take: 30,
  });
  if (rows.length < 7) return 'Histórico ainda raso (menos de uma semana de DailyMetric).';
  const recent7 = rows.slice(0, 7);
  const prev7   = rows.slice(7, 14);
  if (prev7.length === 0) return `Média 7d de streams: ${fmt(Math.round(recent7.reduce((s,r)=>s+(r.spotifyStreams||0),0)/7))}/dia.`;
  const a = recent7.reduce((s,r)=>s+(r.spotifyStreams||0),0)/7;
  const b = prev7.reduce((s,r)=>s+(r.spotifyStreams||0),0)/prev7.length;
  if (!b) return `Média 7d: ${fmt(Math.round(a))} streams/dia.`;
  const pct = ((a-b)/b*100).toFixed(1);
  const arrow = pct >= 0 ? '↑' : '↓';
  return `Streams ${arrow} ${pct}% vs semana anterior (média recente ${fmt(Math.round(a))}/dia).`;
}

async function buildContext(event) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [latest, tasks, recentAnalyses, trend] = await Promise.all([
    prisma.dailyMetric.findFirst({ orderBy: { date: 'desc' } }),
    prisma.task.findMany({
      where: { status: { not: 'feita' }, updatedAt: { gte: since } },
      orderBy: { createdAt: 'desc' }, take: 5,
    }),
    prisma.autoAnalysis.findMany({
      orderBy: { generatedAt: 'desc' }, take: 3,
      select: { summary: true, generatedAt: true, agentType: true },
    }),
    buildTrendSummary(),
  ]);

  return {
    currentMetrics: latest && {
      date: latest.date,
      spotifyStreams: latest.spotifyStreams,
      spotifyMonthlyListeners: latest.spotifyMonthlyListeners,
      spotifyFollowers: latest.spotifyFollowers,
      spotifyPlaylistAdds: latest.spotifyPlaylistAdds,
      youtubeViews: latest.youtubeViews,
      youtubeSubscribers: latest.youtubeSubscribers,
      instagramFollowers: latest.instagramFollowers,
    },
    trend,
    activeTasks: tasks.map(t => `[${t.priority}] ${t.title}`),
    recentAnalyses: recentAnalyses.map(a => `${a.agentType} (${new Date(a.generatedAt).toLocaleDateString('pt-BR')}): ${a.summary}`),
  };
}

function buildSystemPrompt(agentType, context) {
  const basePersona = AGENT_SYSTEM_PROMPTS[agentType] || AGENT_SYSTEM_PROMPTS.manager;
  const contextBlock = `

CONTEXTO ATUAL DO KYAN (Central de Inteligência):

Métricas mais recentes:
${context.currentMetrics ? Object.entries(context.currentMetrics).map(([k,v]) => `- ${k}: ${fmt(v)}`).join('\n') : '(sem métricas no banco ainda)'}

Tendência: ${context.trend}

Tarefas ativas:
${context.activeTasks.length ? context.activeTasks.map(t => '- ' + t).join('\n') : '(nenhuma)'}

Análises recentes (para não repetir):
${context.recentAnalyses.length ? context.recentAnalyses.map(a => '- ' + a).join('\n') : '(nenhuma)'}
`;
  return basePersona + contextBlock;
}

const RESPONSE_FORMAT_INSTRUCTION = `

Responda APENAS com um objeto JSON válido (sem markdown, sem cerca de código, sem texto antes ou depois) com esta estrutura exata:

{
  "summary": "2-3 linhas resumindo o evento e por que importa, citando o número concreto",
  "analysis": "análise completa em texto puro (300+ palavras): contexto, causa provável, impacto, histórico relevante",
  "recommendations": [
    { "action": "ação acionável", "priority": "critical|high|medium|low", "agent": "manager|marketer|arandr|techhacker|finance|booking|stylist|legal|musicproducer|socialmedia", "deadline": "agora|24h|48h|7d|30d", "rationale": "por quê" }
  ],
  "riskIfIgnored": "o que acontece se não agir",
  "opportunityWindow": "quanto tempo a janela permanece aberta"
}`;

function extractJson(text) {
  const cleaned = String(text).replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

async function analyzeEvent(event) {
  const agentType = EVENT_TO_AGENT[event.type] || 'manager';
  const context = await buildContext(event);

  await prisma.detectedEvent.update({ where: { id: event.id }, data: { status: 'analyzing' } });

  const system = buildSystemPrompt(agentType, context) + RESPONSE_FORMAT_INSTRUCTION;
  const user = `EVENTO DETECTADO:
Tipo: ${event.type}
Severidade: ${event.severity}
Título: ${event.title}
Descrição: ${event.description}
Métrica: ${event.metricName}
Valor atual: ${fmt(event.currentValue)}
Baseline (média 7d): ${fmt(Math.round(event.baselineValue))}
Variação: ${event.changePct.toFixed(1)}%
Plataforma: ${event.platform}
Detectado em: ${event.detectedAt}

Analise este evento e responda no formato JSON especificado.`;

  let raw, parsed = null;
  try {
    raw = await ask(system, user, 2000);
    parsed = extractJson(raw);
  } catch (err) {
    console.error('[autoAnalyzer] erro no Claude:', err.message);
  }

  if (!parsed) {
    parsed = {
      summary: 'Não foi possível gerar a análise estruturada. Resposta bruta abaixo.',
      analysis: (raw || '(sem resposta)').slice(0, 4000),
      recommendations: [],
      riskIfIgnored: 'Análise não pôde ser parseada — revise manualmente.',
      opportunityWindow: 'Indefinido.',
    };
  }

  const analysis = await prisma.autoAnalysis.create({
    data: {
      eventId: event.id,
      trigger: 'event',
      agentType,
      summary: String(parsed.summary || '').slice(0, 1000),
      fullAnalysis: String(parsed.analysis || '').slice(0, 6000),
      recommendations: JSON.stringify(parsed.recommendations || []),
      contextUsed: JSON.stringify(context),
      modelUsed: 'claude-opus-4-5',
    },
  });

  await prisma.detectedEvent.update({ where: { id: event.id }, data: { status: 'analyzed' } });
  return analysis;
}

async function analyzePendingEvents(maxPerCycle = 5) {
  // critical/high primeiro, mais antigos primeiro
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const pending = await prisma.detectedEvent.findMany({
    where: { status: 'detected' },
    orderBy: { detectedAt: 'asc' },
    take: maxPerCycle * 2, // pegamos um pouco mais e priorizamos
  });
  pending.sort((a,b) => (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9));
  const slice = pending.slice(0, maxPerCycle);

  for (const ev of slice) {
    try {
      await analyzeEvent(ev);
      await new Promise(r => setTimeout(r, 1500)); // pausa pequena entre análises
    } catch (e) {
      console.error('[autoAnalyzer] falha:', e.message);
      await prisma.detectedEvent.update({ where: { id: ev.id }, data: { status: 'detected' } }).catch(()=>{});
    }
  }
  return slice.length;
}

module.exports = { analyzeEvent, analyzePendingEvents, EVENT_TO_AGENT };
