const express = require('express');
const cm = require('../services/chartmetric');
const router = express.Router();
router.get('/:artistId', async (req, res, next) => {
  try {
    const metrics = await cm.getAudienceMetrics();
    res.json({ metrics, updatedAt: new Date().toISOString() });
  } catch(e) { next(e); }
});
module.exports = router;
