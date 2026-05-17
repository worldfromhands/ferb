const express = require('express');
const router  = express.Router();

// GET /api/instagram/recent?username=kyanmaloka
// Retorna fotos recentes do Instagram via Firecrawl (se FIRECRAWL_API_KEY disponível)
// ou stub vazio caso não configurado
const cache = new Map(); // { username -> { ts, data } }
const TTL   = 10 * 60 * 1000; // 10 min

router.get('/recent', async (req, res) => {
  const username = (req.query.username || '').trim();
  if (!username || !/^[a-zA-Z0-9._]+$/.test(username)) {
    return res.status(400).json({ error: 'username inválido' });
  }

  const cached = cache.get(username);
  if (cached && Date.now() - cached.ts < TTL) {
    return res.json({ photos: cached.data, cached: true });
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    // Sem chave → retorna vazio (ArtistPhotos mostra EmptyState)
    return res.json({ photos: [], cached: false });
  }

  try {
    const resp = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://www.instagram.com/${username}/`,
        formats: [
          {
            type: 'json',
            prompt:
              'Extract up to 12 most recent posts from this Instagram profile. For each post return image_url (the post thumbnail), caption (first line if any), permalink (full URL to the post on instagram.com), and posted_at if visible.',
            schema: {
              posts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    image_url:  { type: 'string' },
                    caption:    { type: 'string' },
                    permalink:  { type: 'string' },
                    posted_at:  { type: 'string' },
                  },
                  required: ['image_url'],
                },
              },
            },
          },
        ],
        onlyMainContent: true,
        waitFor: 2500,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status === 402 ? 402 : 502).json({
        error: `Firecrawl ${resp.status}`,
        detail: text.slice(0, 500),
      });
    }

    const payload = await resp.json();
    const raw     = payload?.data?.json ?? payload?.json;
    const photos  = Array.isArray(raw?.posts) ? raw.posts : [];
    cache.set(username, { ts: Date.now(), data: photos });
    return res.json({ photos, cached: false });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'scrape failed', photos: [] });
  }
});

module.exports = router;
