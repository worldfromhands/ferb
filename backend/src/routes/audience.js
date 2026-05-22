const express = require('express');
const cm = require('../services/chartmetric');
const router = express.Router();

// Isola cada chamada — uma falha do Chartmetric não derruba a resposta inteira.
async function safe(fn, fallback) {
  try {
    const r = await fn();
    return r == null ? fallback : r;
  } catch (e) {
    console.error('[audience] fonte indisponível:', e.response?.status || '', e.message);
    return fallback;
  }
}

router.get('/:artistId', async (req, res, next) => {
  try {
    const [metrics, metricChanges, topCities, topCountries, identity] = await Promise.all([
      safe(() => cm.getAudienceMetrics(), []),
      safe(() => cm.getHomeMetrics(), []),
      safe(() => cm.getTopCities(undefined, 15), []),
      safe(() => cm.getTopCountries(undefined, 10), []),
      safe(() => cm.getIdentitySnapshot(), null),
    ]);

    // Se nada veio do Chartmetric, sinaliza pra UI mostrar estado honesto.
    const available = metrics.length > 0 || topCities.length > 0 || topCountries.length > 0;

    res.json({
      available,
      metrics,
      metricChanges,
      topCities,
      topCountries,
      identity,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
