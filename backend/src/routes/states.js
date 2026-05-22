const express = require('express');
const cm = require('../services/chartmetric');
const { getCityState, stateNames } = require('../data/brazilCityToState');
const router = express.Router();

// GET /api/states/:artistId — audiência brasileira agrupada por estado.
// Reaproveita o chartmetric.js (getTopCities) — sem reautenticar nada.
router.get('/:artistId', async (req, res, next) => {
  try {
    const cities = await cm.getTopCities(undefined, 100);

    const stateMap = {};
    let semEstado = 0;

    for (const c of (cities || [])) {
      const code = getCityState(c.name);
      if (!code) { semEstado++; continue; } // cidade fora do mapa (ou estrangeira)

      if (!stateMap[code]) {
        stateMap[code] = {
          code,
          name: stateNames[code] || code,
          totalListeners: 0,
          cityCount: 0,
          topCities: [],
        };
      }
      stateMap[code].totalListeners += c.listeners || 0;
      stateMap[code].cityCount += 1;
      stateMap[code].topCities.push({ city: c.name, listeners: c.listeners || 0 });
    }

    const states = Object.values(stateMap)
      .map(s => ({
        ...s,
        topCities: s.topCities.sort((a, b) => b.listeners - a.listeners).slice(0, 5),
        avgListenersPerCity: Math.round(s.totalListeners / s.cityCount),
      }))
      .sort((a, b) => b.totalListeners - a.totalListeners)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    res.json({
      states,
      totalStates: states.length,
      totalBRListeners: states.reduce((sum, s) => sum + s.totalListeners, 0),
      citiesUnmapped: semEstado,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
