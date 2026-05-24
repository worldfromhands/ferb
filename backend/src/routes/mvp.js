const express = require('express');
const prisma  = require('../config/prisma');
const { ask } = require('../services/claudeService');
const { AGENT_SYSTEM_PROMPTS } = require('../agents/agentPrompts');
const { buildAgentContext } = require('../agents/agentContext');
const { generateBriefing, invalidateCache } = require('../agents/agentBriefing');
const cm = require('../services/chartmetric');

const router = express.Router();

// ─────────────────────────────────────────────────────
// 1. LOBBY — Todos os agentes com estado atual
// ─────────────────────────────────────────────────────

router.get('/lobby/:artistId', async (req, res, next) => {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        demands: {
          where: { status: 'in_progress' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    res.json(agents.map(a => ({
      ...a,
      activeDemand: a.demands[0] || null,
    })));
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// 2. SALA DO AGENTE
// ─────────────────────────────────────────────────────

router.get('/room/:agentId', async (req, res, next) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.agentId },
      include: { demands: { orderBy: { createdAt: 'desc' } } },
    });
    if (!agent) return res.status(404).json({ error: 'Agente não encontrado' });
    res.json(agent);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// 3. CRIAR DEMANDA
// ─────────────────────────────────────────────────────

router.post('/demand/:agentId', async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { title, description, priority = 'medium', dueDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) return res.status(404).json({ error: 'Agente não encontrado' });

    // Cria a demanda no banco
    const demand = await prisma.demand.create({
      data: {
        agentId,
        title,
        description,
        priority,
        status: 'in_progress',
        dueDate: dueDate && String(dueDate).trim() ? new Date(dueDate) : null,
      },
    });

    // Agente entra em "thinking"
    await prisma.agent.update({ where: { id: agentId }, data: { mood: 'thinking' } });

    // Chama Claude com persona + contexto real do KYAN
    const basePersona  = AGENT_SYSTEM_PROMPTS[agentId] || AGENT_SYSTEM_PROMPTS.manager;
    const context      = await buildAgentContext(agentId);
    const systemPrompt = basePersona + context;

    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const userPrompt = `Data de hoje: ${hoje}.

Você recebeu uma demanda do KYAN:

Título: "${title}"
Descrição: "${description}"
Prioridade: ${priority}
Prazo: ${dueDate || 'Sem prazo definido'}

ENTREGUE A ANÁLISE AGORA. Não confirme que entendeu, não diga "vou cruzar os dados", não prometa entregar em 48 horas — responda a demanda de fato, neste momento, com a resposta completa.

Use os dados reais do KYAN que estão no seu contexto: cite cidades, faixas, métricas e números concretos. Se a demanda pede uma escolha (qual cidade, qual faixa, qual movimento), escolha — uma só — e defenda o porquê. Tenha opinião forte, não fique em cima do muro. Cada recomendação precisa ser acionável hoje e ter ação concreta. Cruze mais de uma fonte de dado sempre que possível.

REGRA ABSOLUTA — NUNCA INVENTE DADOS. Só cite nomes de faixas, álbuns, números de streams, cidades, percentuais ou fatos que estejam EXPLICITAMENTE no seu contexto acima. Se um dado não está no contexto, NÃO o invente — diga claramente "não tenho esse dado" e siga com o que você tem. Uma análise honesta sobre dado faltante vale mais que uma análise confiante sobre dado inventado. Se faltar algum dado, diga o que falta — mas mesmo assim entregue a melhor análise possível com o que você tem. Nunca empurre a resposta para depois.

FORMATO OBRIGATÓRIO: texto corrido, sem asteriscos, sem negrito, sem emojis, sem marcadores. Só texto puro. Seja direto e denso — sem enrolação de abertura.`;

    const agentResponse = await ask(systemPrompt, userPrompt, 1400);

    // Completa a demanda depois de 4–8s de "trabalho"
    const delay = 4000 + Math.random() * 4000;
    setTimeout(async () => {
      try {
        await prisma.demand.update({
          where: { id: demand.id },
          data: { status: 'completed', result: agentResponse, completedAt: new Date() },
        });
        await prisma.agent.update({ where: { id: agentId }, data: { mood: 'happy' } });
        // Volta pra idle 10s depois
        setTimeout(() => {
          prisma.agent.update({ where: { id: agentId }, data: { mood: 'idle' } }).catch(() => {});
        }, 10000);
      } catch (e) {
        console.error('[mvp] completar demanda:', e.message);
      }
    }, delay);

    res.json({
      demand,
      agentResponse,
      message: `${agent.name} recebeu a demanda e está trabalhando...`,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// 4. HISTÓRICO DE DEMANDAS DE UM AGENTE
// ─────────────────────────────────────────────────────

router.get('/demands/:agentId', async (req, res, next) => {
  try {
    const demands = await prisma.demand.findMany({
      where: { agentId: req.params.agentId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(demands);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// 4b. BRIEFING DO AGENTE (resumo + sugestão proativa)
// ─────────────────────────────────────────────────────

router.get('/briefing/:agentId', async (req, res, next) => {
  try {
    const briefing = await generateBriefing(req.params.agentId);
    if (!briefing) return res.status(404).json({ error: 'Agente não encontrado' });
    res.json(briefing);
  } catch (err) {
    next(err);
  }
});

router.post('/briefing/:agentId/refresh', (req, res) => {
  invalidateCache(req.params.agentId);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────
// 5. MAPA REGIONAL (REAL — Chartmetric)
// ─────────────────────────────────────────────────────

router.get('/map/:artistId', async (req, res, next) => {
  try {
    const [cities, countries] = await Promise.all([
      cm.getTopCities(undefined, 20),
      cm.getTopCountries(undefined, 15),
    ]);
    res.json({ cities, countries });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// 6. CONCÍLIO — os 9 agentes debatem, o Gerente sintetiza
// ─────────────────────────────────────────────────────

// Ordem do concílio (Gerente fecha como síntese, então fica fora da rodada)
const CONCILIO_AGENTS = [
  'arandr', 'musicproducer', 'marketer', 'legal',
  'finance', 'booking', 'stylist', 'techhacker', 'socialmedia',
];

router.post('/concilio/:artistId', async (req, res, next) => {
  try {
    const question = (req.body?.question || '').trim();
    if (!question) {
      return res.status(400).json({ error: 'Pergunta obrigatória' });
    }

    // 1. Pareceres dos especialistas — em paralelo
    const takes = await Promise.all(
      CONCILIO_AGENTS.map(async (agentId) => {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } });
        const basePersona = AGENT_SYSTEM_PROMPTS[agentId] || AGENT_SYSTEM_PROMPTS.manager;
        const context     = await buildAgentContext(agentId);
        const userPrompt  = `O KYAN trouxe esta questão ao concílio da agência:

"${question}"

Dê seu parecer exclusivamente pela ótica da sua especialidade. Em até 3 frases, direto: o que você vê e o que recomenda. Use os dados reais do KYAN que estão no seu contexto. Sem markdown, sem asteriscos, sem emojis — texto puro.`;
        let opinion;
        try {
          opinion = await ask(basePersona + context, userPrompt, 400);
        } catch (e) {
          opinion = `(${agent?.name || agentId} não pôde se manifestar agora.)`;
        }
        return { agentId, name: agent?.name || agentId, avatar: agent?.avatar || '', opinion };
      })
    );

    // 2. Síntese do Gerente
    const managerPersona = AGENT_SYSTEM_PROMPTS.manager;
    const managerContext = await buildAgentContext('manager');
    const pareceres = takes.map(t => `${t.name}: ${t.opinion}`).join('\n\n');
    const synthPrompt = `O concílio da agência debateu a questão do KYAN:

"${question}"

Pareceres dos especialistas:

${pareceres}

Como Gerente, sintetize tudo numa recomendação final clara e decidida. Diga o que o KYAN deve fazer, integrando o que cada especialista trouxe. 4 a 6 frases. Aponte a direção — não fique em cima do muro. Sem markdown, sem asteriscos, sem emojis — texto puro.`;

    let synthesis;
    try {
      synthesis = await ask(managerPersona + managerContext, synthPrompt, 700);
    } catch (e) {
      synthesis = 'A síntese do Gerente não pôde ser gerada agora.';
    }

    // 3. Persiste
    const council = await prisma.council.create({
      data: { question, takes: JSON.stringify(takes), synthesis },
    });

    res.json({
      id: council.id,
      question,
      takes,
      synthesis,
      createdAt: council.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/concilios/:artistId', async (req, res, next) => {
  try {
    const councils = await prisma.council.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
    res.json(councils.map(c => ({
      id: c.id,
      question: c.question,
      takes: JSON.parse(c.takes),
      synthesis: c.synthesis,
      createdAt: c.createdAt,
    })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
