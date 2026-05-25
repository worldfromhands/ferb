const express = require('express');
const prisma  = require('../config/prisma');
const { runIntelligenceCycle } = require('../jobs/intelligence');
const router  = express.Router();

function parseEvent(e) {
  return {
    ...e,
    contextData: e.contextData ? safeJson(e.contextData) : {},
    analysis: e.analysis ? {
      ...e.analysis,
      recommendations: safeJson(e.analysis.recommendations),
    } : null,
  };
}

function parseAnalysis(a) {
  return {
    ...a,
    recommendations: safeJson(a.recommendations),
    contextUsed: undefined, // não devolvemos o contexto completo na lista (pesa muito)
  };
}

function safeJson(s) { try { return JSON.parse(s); } catch { return s; } }

// ─────────────────────────────────────────────────────
// GET /api/intelligence/dashboard — resumo pra Central
// ─────────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [pendingReview, critical, totalEvents30d, lastMetric, lastAnalysis] = await Promise.all([
      prisma.detectedEvent.count({ where: { status: 'analyzed', analysis: { humanReview: null } } }),
      prisma.detectedEvent.count({ where: { severity: { in: ['critical', 'high'] }, detectedAt: { gte: since30d } } }),
      prisma.detectedEvent.count({ where: { detectedAt: { gte: since30d } } }),
      prisma.dailyMetric.findFirst({ orderBy: { date: 'desc' } }),
      prisma.autoAnalysis.findFirst({ orderBy: { generatedAt: 'desc' }, select: { generatedAt: true, agentType: true } }),
    ]);
    res.json({
      pendingReview,
      critical30d: critical,
      events30d: totalEvents30d,
      lastMetric,
      lastAnalysis,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// GET /api/intelligence/events
// ─────────────────────────────────────────────────────
router.get('/events', async (req, res, next) => {
  try {
    const { status, severity, limit = 30 } = req.query;
    const where = {};
    if (status)   where.status = status;
    if (severity) where.severity = severity;

    const events = await prisma.detectedEvent.findMany({
      where,
      include: { analysis: true },
      orderBy: { detectedAt: 'desc' },
      take: Math.min(Number(limit) || 30, 100),
    });
    res.json(events.map(parseEvent));
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// GET /api/intelligence/analyses — histórico de análises
// ─────────────────────────────────────────────────────
router.get('/analyses', async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const list = await prisma.autoAnalysis.findMany({
      include: { event: { select: { title: true, type: true, severity: true } } },
      orderBy: { generatedAt: 'desc' },
      take: Math.min(Number(limit) || 20, 100),
    });
    res.json(list.map(parseAnalysis));
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// POST /api/intelligence/events/:id/review — review humano
// ─────────────────────────────────────────────────────
router.post('/events/:id/review', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body || {};
    if (!['approved', 'rejected', 'modified'].includes(decision)) {
      const e = new Error('decision deve ser approved | rejected | modified');
      e.statusCode = 400; return next(e);
    }

    const event = await prisma.detectedEvent.findUnique({ where: { id }, include: { analysis: true } });
    if (!event) { const e = new Error('Evento não encontrado'); e.statusCode = 404; return next(e); }

    if (event.analysis) {
      await prisma.autoAnalysis.update({
        where: { id: event.analysis.id },
        data: { humanReview: decision, humanNotes: notes || null, reviewedAt: new Date() },
      });
    }

    await prisma.detectedEvent.update({
      where: { id },
      data: { status: decision === 'rejected' ? 'dismissed' : 'actioned' },
    });

    // Se aprovado e tem recomendação top, cria uma Task pendente
    if (decision === 'approved' && event.analysis) {
      const recs = safeJson(event.analysis.recommendations) || [];
      const top = Array.isArray(recs) ? recs[0] : null;
      if (top?.action) {
        const priorityMap = { critical: 'critica', high: 'alta', medium: 'media', low: 'baixa' };
        await prisma.task.create({
          data: {
            title: String(top.action).slice(0, 200),
            priority: priorityMap[top.priority] || 'alta',
            ferb: true,
            status: 'todo',
          },
        }).catch(() => {});
      }
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// POST /api/intelligence/trigger — força um ciclo manual
// ─────────────────────────────────────────────────────
router.post('/trigger', async (req, res) => {
  res.json({ ok: true, message: 'Ciclo iniciado em background' });
  runIntelligenceCycle().catch(e => console.error('[trigger] falhou:', e.message));
});

module.exports = router;
