// GET /api/track?order=FM-XXXXXXX&email=...  → order status from Stripe.
// To update a customer's status, edit the payment's metadata in the Stripe dashboard:
//   status   = Processing | Shipped | Delivered   (any text works)
//   tracking = carrier tracking number or link
import { stripe, send, fail } from './_lib.js';

export default async function handler(req, res) {
  try {
    const q = new URL(req.url, 'http://x').searchParams;
    const order = (q.get('order') || '').trim().toUpperCase();
    const email = (q.get('email') || '').trim().toLowerCase();
    if (!/^FM-[A-F0-9]{7}$/.test(order)) return send(res, 400, { error: 'Order numbers look like FM-1A2B3C4' });
    const r = await stripe('GET', '/payment_intents/search', { query: `metadata['order']:'${order}'`, limit: 1 });
    const pi = r.data && r.data[0];
    if (!pi || pi.status !== 'succeeded') return send(res, 404, { error: 'We could not find a paid order with that number' });
    const ch = await stripe('GET', `/charges/${pi.latest_charge}`);
    const owner = (ch.billing_details?.email || pi.receipt_email || '').toLowerCase();
    if (email && owner && email !== owner) return send(res, 404, { error: 'That email does not match this order' });
    const m = pi.metadata || {};
    send(res, 200, { order, status: m.status || 'Processing', tracking: m.tracking || '', placed: pi.created * 1000, total: pi.amount / 100 });
  } catch (e) { fail(res, e); }
}
