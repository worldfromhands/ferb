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

    const userPrompt = `Você recebeu uma demanda:

Título: "${title}"
Descrição: "${description}"
Prioridade: ${priority}
Prazo: ${dueDate || 'Sem prazo definido'}

Responda confirmando que entendeu, como vai abordar e quando pode entregar — use os dados reais do KYAN do seu contexto para fundamentar a resposta. Seja conciso, direto e específico.

FORMATO OBRIGATÓRIO: texto corrido, sem asteriscos, sem negrito, sem emojis, sem marcadores. Só texto puro.`;

    const agentResponse = await ask(systemPrompt, userPrompt);

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

module.exports = router;
