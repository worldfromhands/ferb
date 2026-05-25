const express = require('express');
const yta = require('../services/youtubeAnalytics');
const router = express.Router();

router.get('/:artistId', (req, res, next) => {
  try {
    const data = yta.get();
    if (!data) return res.status(404).json({ error: 'Snapshot YouTube não encontrado. Rode scripts/importYoutubeBundle.js.' });
    res.json(data);
  } catch (e) { next(e); }
});

module.exports = router;
