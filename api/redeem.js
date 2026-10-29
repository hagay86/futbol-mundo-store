// POST /api/redeem {code} → checks a Mundo XI code's signature and (with the database on) marks it used for good.
import { readCode, send, readJson, fail } from './_lib.js';
import { dbReady, redis, currentUser } from './_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
    const { code } = await readJson(req);
    const clean = String(code || '').trim().toUpperCase();
    const info = readCode(clean);
    if (!info) return send(res, 404, { error: "We couldn't find that code. Check the letters and try again" });
    if (dbReady()) {
      const u = await currentUser(req);
      if (!u) return send(res, 401, { error: 'Sign in to redeem codes' });
      const ok = await redis('SET', 'used:' + clean, u.email + ':' + Date.now(), 'NX');
      if (!ok) return send(res, 409, { error: 'That code has already been redeemed' });
    }
    send(res, 200, info);
  } catch (e) { fail(res, e); }
}
