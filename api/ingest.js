// POST /api/ingest → stores the partner-store catalogue feed in Redis, in chunks.
// Body: {k, part, total, data}. Protected by a one-time key (only its SHA-256 lives here).
import { createHash } from 'node:crypto';
import { send, readJson, fail } from './_lib.js';
import { redis } from './_db.js';

const KEY_HASH = '34f8e72c2645bc04e578051f443976321cda84ae3461645a55309b2d6d9c94ee';
const cors = res => { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  try {
    const b = await readJson(req);
    if (createHash('sha256').update(String(b.k || '')).digest('hex') !== KEY_HASH) return send(res, 403, { error: 'Bad key' });
    const part = +b.part, total = +b.total;
    if (!(part >= 0 && total > 0 && part < total && total < 100) || typeof b.data !== 'string') return send(res, 400, { error: 'Bad chunk' });
    await redis('SET', 'catnew:' + part, b.data);
    if (b.commit) {
      // all chunks are in: check the JSON parses, then switch the live catalogue over
      let s = ''; for (let i = 0; i < total; i++) s += (await redis('GET', 'catnew:' + i)) || '';
      const j = JSON.parse(s);
      for (let i = 0; i < total; i++) await redis('SET', 'cat:' + i, await redis('GET', 'catnew:' + i));
      await redis('SET', 'cat:n', String(total));
      await redis('SET', 'cat:ver', String(Date.now()));
      return send(res, 200, { ok: true, rows: j.rows.length, bytes: s.length });
    }
    send(res, 200, { ok: true, part });
  } catch (e) { fail(res, e); }
}
