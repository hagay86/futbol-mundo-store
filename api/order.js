// GET /api/order?id=cs_...  → confirms a paid Stripe Checkout Session.
// Codes are NOT returned here: they are emailed a few minutes after purchase.
import { stripe, send, fail } from './_lib.js';
import { dbReady, processPaidSession, siteUrl, CODE_DELAY_MIN } from './_db.js';

export default async function handler(req, res) {
  try {
    const id = new URL(req.url, 'http://x').searchParams.get('id') || '';
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return send(res, 400, { error: 'Unknown order' });
    const s = await stripe('GET', `/checkout/sessions/${id}`, { 'expand[0]': 'line_items' });
    if (s.payment_status !== 'paid') return send(res, 200, { paid: false, status: s.status });
    const m = s.metadata || {};
    let o = null;
    if (dbReady()) o = await processPaidSession(s, siteUrl(req));
    send(res, 200, {
      paid: true,
      order: m.order || id.slice(-8).toUpperCase(),
      email: s.customer_details?.email || '',
      total: (s.amount_total || 0) / 100,
      spent: (s.amount_subtotal || 0) / 100,
      scarf: m.scarf === '1',
      codeCount: (+m.shirts || 0) + (+m.pts ? 1 : 0) + (m.scarf === '1' ? 1 : 0),
      shirts: +m.shirts || 0, pts: +m.pts || 0,
      delayMin: CODE_DELAY_MIN,
      emailed: !!o,
      items: (s.line_items?.data || []).map(l => ({ name: l.description, q: l.quantity, amount: l.amount_total / 100 })),
    });
  } catch (e) { fail(res, e); }
}
