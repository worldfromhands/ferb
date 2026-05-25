const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express          = require('express');
const cors             = require('cors');
const cron             = require('node-cron');
const errorHandler     = require('./middleware/errorHandler');
const placeholderRoutes = require('./routes/placeholder');
const { runDailyReport } = require('./jobs/dailyReport');
const { runIntelligenceCycle } = require('./jobs/intelligence');

const homeRoutes       = require('./routes/home');
const audienceRoutes   = require('./routes/audience');
const relationsRoutes  = require('./routes/relations');
const executionRoutes  = require('./routes/execution');
const instagramRoutes  = require('./routes/instagram');
const tiktokRoutes     = require('./routes/tiktok');
const platformsRoutes  = require('./routes/platforms');
const reportsRoutes    = require('./routes/reports');
const dnaRoutes        = require('./routes/dna');
const statesRoutes     = require('./routes/states');
const catalogRoutes    = require('./routes/catalog');
const intelligenceRoutes = require('./routes/intelligence');
const mvpRoutes        = require('./routes/mvp');

const app  = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'FERB online', version: '2.0.0', time: new Date().toISOString() });
});

// Fase 1
app.use('/api/home',      homeRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/audience',  audienceRoutes);
app.use('/api/relations', relationsRoutes);
app.use('/api/execution', executionRoutes);
app.use('/api/tiktok',    tiktokRoutes);
app.use('/api/platforms', platformsRoutes);
app.use('/api/reports',   reportsRoutes);
app.use('/api/dna',       dnaRoutes);
app.use('/api/states',    statesRoutes);
app.use('/api/catalog',   catalogRoutes);
app.use('/api/intelligence', intelligenceRoutes);

app.use('/api/mvp',       mvpRoutes);

// Fase 2/3 — placeholder
app.use('/api/movement',      placeholderRoutes('MOVIMENTO'));
app.use('/api/creation',      placeholderRoutes('CRIACAO'));
app.use('/api/opportunities', placeholderRoutes('OPORTUNIDADES'));
app.use('/api/identity',      placeholderRoutes('IDENTIDADE'));
app.use('/api/financial',     placeholderRoutes('FINANCEIRO'));
app.use('/api/bureaucracy',   placeholderRoutes('BUROCRACIA'));

app.use(errorHandler);

// ─── Cron — relatório diário + ciclo de inteligência (6:30) ───
cron.schedule('30 6 * * *', async () => {
  console.log('[cron] disparando relatório diário das 6:30...');
  try {
    await runDailyReport();
    await runIntelligenceCycle();
  } catch (e) {
    console.error('[cron] falhou:', e.message);
  }
}, { timezone: 'America/Sao_Paulo' });

app.listen(PORT, () => {
  console.log(`\n  FERB backend v2 rodando em http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  Cron: relatório diário agendado para 6:30 (America/Sao_Paulo)\n`);
});
