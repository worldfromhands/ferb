const express = require('express');
const yt = require('../services/youtube');
const dz = require('../services/deezer');
const lf = require('../services/lastfm');
const router = express.Router();

// Isola cada plataforma — uma falha não derruba as outras.
async function safe(fn, fallback) {
  try {
    const r = await fn();
    return r == null ? fallback : r;
  } catch (e) {
    console.error('[platforms] fonte indisponível:', e.message);
    return fallback;
  }
}

// Agrega snapshots de YouTube + Deezer + Last.fm.
router.get('/:artistId', async (req, res, next) => {
  try {
    const [youtube, deezer, lastfm] = await Promise.all([
      safe(() => yt.getSnapshot(), null),
      safe(() => dz.getSnapshot(), null),
      safe(() => lf.getSnapshot(), null),
    ]);

    res.json({
      youtube,
      youtubeConfigured: yt.isConfigured(),
      deezer,
      deezerConfigured:  dz.isConfigured(),
      lastfm,
      lastfmConfigured:  lf.isConfigured(),
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
