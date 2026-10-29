// POST /api/clientlog → writes a short checkout error report to the Vercel logs (for debugging payments).
import { send, readJson } from './_lib.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, {});
  try { const b = await readJson(req); console.log('[client]', String(b.where || '').slice(0, 40), String(b.msg || '').slice(0, 1500), String(req.headers['user-agent'] || '').slice(0, 120)); } catch (e) {}
  send(res, 200, { ok: true });
}
