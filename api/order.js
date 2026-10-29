// GET /api/order?id=cs_...   → confirms a paid Stripe Checkout Session.
// GET /api/order?id=pp:<ID>  → captures and confirms a PayPal order (the buyer just approved it).
// Codes are NOT returned here: they are emailed a few minutes after purchase and shown in My account.
import { stripe, send, fail } from './_lib.js';
import { dbReady, processPaidSession, siteUrl, CODE_DELAY_MIN, getJSON } from './_db.js';
import { paypalReady, capturePaypalOrder, paypalShip } from './_paypal.js';

const reply = (res, m, o, extra) => send(res, 200, Object.assign({
  paid: true, order: m.order, scarf: m.scarf === '1',
  codeCount: (+m.shirts || 0) + (+m.pts ? 1 : 0) + (m.scarf === '1' ? 1 : 0),
  shirts: +m.shirts || 0, pts: +m.pts || 0, delayMin: CODE_DELAY_MIN, emailed: !!o,
}, extra));

export default async function handler(req, res) {
  try {
    const id = new URL(req.url, 'http://x').searchParams.get('id') || '';
    if (/^pp:[A-Z0-9]{10,30}$/.test(id)) {
      if (!paypalReady() || !dbReady()) return send(res, 503, { error: 'Payments are being set up' });
      const ppId = id.slice(3);
      const saved = await getJSON('pp:' + ppId);
      if (!saved) return send(res, 404, { error: 'Unknown order' });
      const done = await getJSON('order:pp_' + ppId);
      let o = done;
      if (!done) {
        let cap; try { cap = await capturePaypalOrder(ppId); } catch (e) { console.log('[order] capture failed', ppId, e.issue || '', e.message); throw e; }
        console.log('[order] capture', ppId, cap ? 'COMPLETED' : 'not completed');
        if (!cap) return send(res, 200, { paid: false });
        const pu = cap.purchase_units[0], total = Math.round(+pu.payments.captures[0].amount.value * 100);
        o = await processPaidSession({ id: 'pp_' + ppId, payment_status: 'paid', metadata: saved.meta, provider: 'paypal',
          customer_details: { email: cap.payer?.email_address || saved.meta.uid }, amount_total: total, amount_subtotal: saved.subtotal,
          items: saved.lines, ship: saved.addr ? { name: saved.addr.name, phone: saved.addr.phone, address: { line1: saved.addr.line1, line2: saved.addr.line2, city: saved.addr.city, state: saved.addr.state, postal_code: saved.addr.zip, country: saved.addr.country } } : paypalShip(cap) }, siteUrl(req));
      }
      return reply(res, saved.meta, o, { email: o?.email || saved.meta.uid || '', total: o?.total ?? 0, spent: o?.spent ?? 0, items: saved.lines });
    }
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return send(res, 400, { error: 'Unknown order' });
    const s = await stripe('GET', `/checkout/sessions/${id}`, { 'expand[0]': 'line_items' });
    if (s.payment_status !== 'paid') return send(res, 200, { paid: false, status: s.status });
    let o = null;
    if (dbReady()) o = await processPaidSession(s, siteUrl(req));
    reply(res, s.metadata || {}, o, {
      email: s.customer_details?.email || '', total: (s.amount_total || 0) / 100, spent: (s.amount_subtotal || 0) / 100,
      items: (s.line_items?.data || []).map(l => ({ name: l.description, q: l.quantity, amount: l.amount_total / 100 })),
    });
  } catch (e) { fail(res, e); }
}
