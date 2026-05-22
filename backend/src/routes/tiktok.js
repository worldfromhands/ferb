const express = require('express');
const tiktok  = require('../services/tiktok');
const router  = express.Router();

// Para onde mandar o usuário de volta depois do callback
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─────────────────────────────────────────────────────
// STATUS — o app está configurado? a conta está conectada?
// ─────────────────────────────────────────────────────
router.get('/status', async (req, res, next) => {
  try {
    const auth = await tiktok.getStoredAuth();
    res.json({
      configured: tiktok.isConfigured(),
      connected:  Boolean(auth),
      displayName: auth?.displayName || null,
      avatarUrl:   auth?.avatarUrl || null,
      redirectUri: tiktok.redirectUri(),
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// AUTH — inicia o login: redireciona pro TikTok
// ─────────────────────────────────────────────────────
router.get('/auth', (req, res, next) => {
  try {
    if (!tiktok.isConfigured()) {
      const e = new Error('TikTok nao configurado (TIKTOK_CLIENT_KEY/SECRET ausentes)');
      e.statusCode = 400;
      return next(e);
    }
    res.redirect(tiktok.getAuthUrl('ferb'));
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// CALLBACK — TikTok devolve o `code` aqui
// ─────────────────────────────────────────────────────
router.get('/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('[tiktok] callback erro:', error, error_description);
    return res.redirect(`${FRONTEND}/dados?tiktok=erro&motivo=${encodeURIComponent(String(error))}`);
  }
  if (!code) {
    return res.redirect(`${FRONTEND}/dados?tiktok=erro&motivo=sem_code`);
  }

  try {
    await tiktok.exchangeCode(String(code));
    res.redirect(`${FRONTEND}/dados?tiktok=ok`);
  } catch (err) {
    console.error('[tiktok] troca de code falhou:', err.message);
    res.redirect(`${FRONTEND}/dados?tiktok=erro&motivo=${encodeURIComponent(err.message.slice(0, 80))}`);
  }
});

// ─────────────────────────────────────────────────────
// SNAPSHOT — perfil + vídeos da conta conectada
// ─────────────────────────────────────────────────────
router.get('/snapshot', async (req, res, next) => {
  try {
    res.json(await tiktok.getSnapshot());
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// DISCONNECT — remove o token salvo
// ─────────────────────────────────────────────────────
router.post('/disconnect', async (req, res, next) => {
  try {
    res.json(await tiktok.disconnect());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
