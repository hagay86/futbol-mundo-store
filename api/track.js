// GET /api/track?order=FM-XXXXXXX&email=...  → order status (from the store's database, Stripe as a fallback).
import { stripe, stripeKey, send, fail } from './_lib.js';
import { dbReady, redis, getJSON } from './_db.js';

export default async function handler(req, res) {
  try {
    const q = new URL(req.url, 'http://x').searchParams;
    const order = (q.get('order') || '').trim().toUpperCase();
    const email = (q.get('email') || '').trim().toLowerCase();
    if (!/^FM-[A-F0-9]{7}$/.test(order)) return send(res, 400, { error: 'Order numbers look like FM-1A2B3C4' });
    if (dbReady()) {
      const id = await redis('GET', 'ordernum:' + order);
      const o = id && await getJSON('order:' + id);
      if (o) {
        if (email && o.email && email !== o.email) return send(res, 404, { error: 'That email does not match this order' });
        return send(res, 200, { order, status: o.status || 'Processing', tracking: o.tracking || '', placed: o.created, total: o.total });
      }
    }
    if (!stripeKey()) return send(res, 404, { error: 'We could not find a paid order with that number' });
    const r = await stripe('GET', '/payment_intents/search', { query: `metadata['order']:'${order}'`, limit: 1 });
    const pi = r.data && r.data[0];
    if (!pi || pi.status !== 'succeeded') return send(res, 404, { error: 'We could not find a paid order with that number' });
    const m = pi.metadata || {};
    send(res, 200, { order, status: m.status || 'Processing', tracking: m.tracking || '', placed: pi.created * 1000, total: pi.amount / 100 });
  } catch (e) { fail(res, e); }
}
