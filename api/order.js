// GET /api/order?id=cs_...  → confirms a paid Stripe Checkout Session and returns
// the order summary plus its signed Mundo XI codes (same codes every time for the same order).
import { stripe, makeCode, send, fail, SHIRT_POINTS } from './_lib.js';

export default async function handler(req, res) {
  try {
    const id = new URL(req.url, 'http://x').searchParams.get('id') || '';
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return send(res, 400, { error: 'Unknown order' });
    const s = await stripe('GET', `/checkout/sessions/${id}`, { 'expand[0]': 'line_items' });
    if (s.payment_status !== 'paid') return send(res, 200, { paid: false, status: s.status });
    const m = s.metadata || {};
    const shirts = +m.shirts || 0, pts = +m.pts || 0, scarf = m.scarf === '1';
    const codes = [];
    for (let i = 0; i < shirts; i++) codes.push({ code: makeCode('P', SHIRT_POINTS, `${id}:shirt:${i}`), label: `Shirt ${i + 1}: ${SHIRT_POINTS.toLocaleString('en-US')} points (one 6-player pack)` });
    if (pts) codes.push({ code: makeCode('P', pts, `${id}:points`), label: `${pts.toLocaleString('en-US')} points you bought` });
    if (scarf) codes.push({ code: makeCode('S', 0, `${id}:scarf`), label: 'Free scarf bonus: 1 Mundo XI player' });
    send(res, 200, {
      paid: true,
      order: m.order || id.slice(-8).toUpperCase(),
      email: s.customer_details?.email || '',
      total: (s.amount_total || 0) / 100,
      spent: (s.amount_subtotal || 0) / 100,
      scarf,
      items: (s.line_items?.data || []).map(l => ({ name: l.description, q: l.quantity, amount: l.amount_total / 100 })),
      codes,
    });
  } catch (e) { fail(res, e); }
}
