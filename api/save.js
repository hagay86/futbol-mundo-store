// GET /api/save → this account's Mundo XI save.  PUT /api/save {data} → store it.
import { send, readJson, fail } from './_lib.js';
import { currentUser, getJSON, setJSON } from './_db.js';

export default async function handler(req, res) {
  try {
    const u = await currentUser(req);
    if (!u) return send(res, 401, { error: 'Sign in to sync your game' });
    if (req.method === 'GET') return send(res, 200, { data: await getJSON('save:' + u.email) });
    if (req.method !== 'PUT' && req.method !== 'POST') return send(res, 405, { error: 'Use GET or PUT' });
    const { data } = await readJson(req);
    const raw = JSON.stringify(data || {});
    if (raw.length > 900000) return send(res, 413, { error: 'Save too large' });
    await setJSON('save:' + u.email, { ...data, savedAt: Date.now() });
    send(res, 200, { ok: true });
  } catch (e) { fail(res, e); }
}
