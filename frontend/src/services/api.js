// Toda chamada ao backend passa por aqui.
const BASE = import.meta.env.VITE_API_URL || '';

async function request(method, path, body) {
  try {
    const opts = { method, headers: {} };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const resp = await fetch(`${BASE}${path}`, opts);
    if (!resp.ok) {
      const b = await resp.json().catch(() => ({}));
      throw new Error(b.message || `Erro ${resp.status}`);
    }
    return { data: await resp.json(), error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

export const api = {
  get:   (path)       => request('GET',   path),
  post:  (path, body) => request('POST',  path, body || {}),
  patch: (path, body) => request('PATCH', path, body || {}),
};
