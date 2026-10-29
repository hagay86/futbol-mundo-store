// POST /api/redeem {code} → checks the signature of a Mundo XI code and says what it unlocks.
import { readCode, send, readJson, fail } from './_lib.js';

export default async function handler(req, res) {
  try {
    const { code } = req.method === 'POST' ? await readJson(req) : { code: new URL(req.url, 'http://x').searchParams.get('code') };
    const info = readCode(code);
    if (!info) return send(res, 404, { error: "We couldn't find that code. Check the letters and try again" });
    send(res, 200, info);
  } catch (e) { fail(res, e); }
}
