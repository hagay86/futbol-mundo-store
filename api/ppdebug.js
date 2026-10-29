// GET /api/ppdebug?k=KEY&id=ORDERID → PayPal's view of an order (for debugging card payments). Protected by the ops key.
import { createHash } from 'node:crypto';
import { send, fail } from './_lib.js';
import { paypal } from './_paypal.js';
const KEY_HASH = '34f8e72c2645bc04e578051f443976321cda84ae3461645a55309b2d6d9c94ee';
export default async function handler(req, res) {
  try {
    const q = new URL(req.url, 'http://x').searchParams;
    if (createHash('sha256').update(q.get('k') || '').digest('hex') !== KEY_HASH) return send(res, 403, { error: 'no' });
    const id = (q.get('id') || '').replace(/[^A-Z0-9]/g, '');
    const o = await paypal('GET', `/v2/checkout/orders/${id}`);
    send(res, 200, o);
  } catch (e) { send(res, 200, { error: e.message, issue: e.issue, status: e.status }); }
}
