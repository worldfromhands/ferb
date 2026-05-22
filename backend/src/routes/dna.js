const express = require('express');
const { getDNA } = require('../services/dna');
const router = express.Router();

// GET /api/dna/:artistId — perfil sonoro do KYAN (via ReccoBeats)
router.get('/:artistId', async (req, res, next) => {
  try {
    res.json(await getDNA());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
