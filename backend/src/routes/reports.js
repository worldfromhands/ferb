const express = require('express');
const prisma  = require('../config/prisma');
const { runDailyReport } = require('../jobs/dailyReport');
const router  = express.Router();

function parseMetrics(r) {
  return { ...r, metrics: r.metrics ? JSON.parse(r.metrics) : [] };
}

// ─────────────────────────────────────────────────────
// LISTAR — histórico de relatórios diários
// ─────────────────────────────────────────────────────
router.get('/:artistId', async (req, res, next) => {
  try {
    const reports = await prisma.dailyReport.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    });
    res.json({ reports: reports.map(parseMetrics) });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// GERAR AGORA — dispara o job manualmente
// ─────────────────────────────────────────────────────
router.post('/:artistId/run', async (req, res, next) => {
  try {
    const report = await runDailyReport();
    res.json({ ok: true, report: parseMetrics(report) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
