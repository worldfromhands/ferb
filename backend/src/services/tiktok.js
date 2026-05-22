/**
 * TikTok — OAuth (authorization_code) + leitura de dados do artista.
 * Docs: https://developers.tiktok.com/doc/login-kit-web
 *
 * IMPORTANTE: a API do TikTok NÃO permite consultar stats de um artista
 * arbitrário. O artista (KYAN) precisa logar e autorizar o app uma vez.
 * Depois disso o token fica salvo no banco e renova sozinho.
 *
 * Env (backend/.env):
 *   TIKTOK_CLIENT_KEY=
 *   TIKTOK_CLIENT_SECRET=
 *   TIKTOK_REDIRECT_URI=   (opcional — default abaixo)
 *
 * Pré-requisito no portal TikTok (https://developers.tiktok.com):
 *   - Registrar o Redirect URI exatamente igual ao usado aqui
 *   - Habilitar os scopes: user.info.basic, user.info.profile,
 *     user.info.stats, video.list
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const axios  = require(path.join(__dirname, '../../node_modules/axios/dist/node/axios.cjs'));
const prisma = require('../config/prisma');

const AUTHORIZE_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TOKEN_URL     = 'https://open.tiktokapis.com/v2/oauth/token/';
const USER_URL      = 'https://open.tiktokapis.com/v2/user/info/';
const VIDEO_URL     = 'https://open.tiktokapis.com/v2/video/list/';

const SCOPES = 'user.info.basic,user.info.profile,user.info.stats,video.list';

const USER_FIELDS  = 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,follower_count,following_count,likes_count,video_count';
const VIDEO_FIELDS = 'id,title,video_description,view_count,like_count,comment_count,share_count,create_time,cover_image_url,share_url';

function clientKey()    { return process.env.TIKTOK_CLIENT_KEY; }
function clientSecret() { return process.env.TIKTOK_CLIENT_SECRET; }
function redirectUri()  { return process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/api/tiktok/callback'; }

function isConfigured() {
  return Boolean(clientKey() && clientSecret());
}

// ─── OAUTH ─────────────────────────────────────────────

/** URL para onde o KYAN é mandado para logar e autorizar. */
function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_key:    clientKey(),
    scope:         SCOPES,
    response_type: 'code',
    redirect_uri:  redirectUri(),
    state:         state || 'ferb',
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/** Troca o `code` recebido no callback por tokens e salva no banco. */
async function exchangeCode(code) {
  const r = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      client_key:    clientKey(),
      client_secret: clientSecret(),
      code,
      grant_type:    'authorization_code',
      redirect_uri:  redirectUri(),
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return persistToken(r.data);
}

/** Salva/atualiza o token no banco (uma linha por open_id). */
async function persistToken(data) {
  if (data.error) {
    throw new Error(`TikTok OAuth: ${data.error} — ${data.error_description || ''}`);
  }
  const now = Date.now();
  const record = {
    accessToken:      data.access_token,
    refreshToken:     data.refresh_token,
    scope:            data.scope || null,
    expiresAt:        new Date(now + (data.expires_in || 86400) * 1000),
    refreshExpiresAt: data.refresh_expires_in ? new Date(now + data.refresh_expires_in * 1000) : null,
  };
  return prisma.tikTokAuth.upsert({
    where:  { openId: data.open_id },
    update: record,
    create: { openId: data.open_id, ...record },
  });
}

/** Renova o access_token usando o refresh_token. */
async function refreshToken(auth) {
  const r = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      client_key:    clientKey(),
      client_secret: clientSecret(),
      grant_type:    'refresh_token',
      refresh_token: auth.refreshToken,
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  if (r.data.error) {
    throw new Error(`TikTok refresh: ${r.data.error} — ${r.data.error_description || ''}`);
  }
  // o refresh pode não trazer open_id — preserva o existente
  return persistToken({ ...r.data, open_id: r.data.open_id || auth.openId });
}

// ─── ESTADO ────────────────────────────────────────────

/** Lê a conta conectada (ou null). */
async function getStoredAuth() {
  return prisma.tikTokAuth.findFirst({ orderBy: { updatedAt: 'desc' } });
}

async function isConnected() {
  return Boolean(await getStoredAuth());
}

/** Retorna um access_token válido, renovando se estiver perto de expirar. */
async function getValidToken() {
  let auth = await getStoredAuth();
  if (!auth) return null;
  // renova se faltar menos de 2 min
  if (Date.now() > auth.expiresAt.getTime() - 120000) {
    auth = await refreshToken(auth);
  }
  return auth;
}

async function disconnect() {
  await prisma.tikTokAuth.deleteMany({});
  return { ok: true };
}

// ─── DADOS ─────────────────────────────────────────────

async function getUserInfo(token) {
  const r = await axios.get(`${USER_URL}?fields=${USER_FIELDS}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.data?.data?.user || null;
}

async function getVideos(token, maxCount = 20) {
  const r = await axios.post(
    `${VIDEO_URL}?fields=${VIDEO_FIELDS}`,
    { max_count: maxCount },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return r.data?.data?.videos || [];
}

/** Snapshot completo: perfil + vídeos recentes. */
async function getSnapshot() {
  if (!isConfigured()) return { configured: false, connected: false };
  const auth = await getValidToken();
  if (!auth) return { configured: true, connected: false };

  try {
    const [user, videos] = await Promise.all([
      getUserInfo(auth.accessToken),
      getVideos(auth.accessToken, 20).catch(() => []),
    ]);

    // guarda nome/avatar pra exibir mesmo sem nova chamada
    if (user) {
      await prisma.tikTokAuth.update({
        where: { id: auth.id },
        data:  { displayName: user.display_name || null, avatarUrl: user.avatar_url || null },
      }).catch(() => {});
    }

    return {
      configured: true,
      connected:  true,
      user,
      videos: videos.map(v => ({
        id:       v.id,
        title:    v.title || v.video_description || '(sem título)',
        views:    v.view_count,
        likes:    v.like_count,
        comments: v.comment_count,
        shares:   v.share_count,
        cover:    v.cover_image_url,
        url:      v.share_url,
        createdAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
      })),
    };
  } catch (e) {
    console.error('[tiktok] snapshot:', e.response?.status, e.response?.data?.error || e.message);
    return { configured: true, connected: true, error: 'Falha ao ler dados do TikTok. Pode ser necessário reconectar.' };
  }
}

module.exports = {
  isConfigured,
  isConnected,
  getAuthUrl,
  exchangeCode,
  getStoredAuth,
  getSnapshot,
  disconnect,
  redirectUri,
};
