const express = require('express');
const { getCatalog } = require('../services/catalog');
const router = express.Router();

// GET /api/catalog/:artistId — catálogo completo (Spotify for Artists snapshot)
router.get('/:artistId', (req, res, next) => {
  try {
    res.json(getCatalog());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
