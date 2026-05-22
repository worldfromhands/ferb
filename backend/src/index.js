const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express          = require('express');
const cors             = require('cors');
const errorHandler     = require('./middleware/errorHandler');
const placeholderRoutes = require('./routes/placeholder');

const homeRoutes       = require('./routes/home');
const audienceRoutes   = require('./routes/audience');
const relationsRoutes  = require('./routes/relations');
const executionRoutes  = require('./routes/execution');
const instagramRoutes  = require('./routes/instagram');
const tiktokRoutes     = require('./routes/tiktok');
const platformsRoutes  = require('./routes/platforms');
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

app.use('/api/mvp',       mvpRoutes);

// Fase 2/3 — placeholder
app.use('/api/movement',      placeholderRoutes('MOVIMENTO'));
app.use('/api/creation',      placeholderRoutes('CRIACAO'));
app.use('/api/opportunities', placeholderRoutes('OPORTUNIDADES'));
app.use('/api/identity',      placeholderRoutes('IDENTIDADE'));
app.use('/api/financial',     placeholderRoutes('FINANCEIRO'));
app.use('/api/bureaucracy',   placeholderRoutes('BUROCRACIA'));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n  FERB backend v2 rodando em http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health\n`);
});
