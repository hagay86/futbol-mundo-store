// POST /api/webhook ← Stripe events. Each event is re-fetched from Stripe with the secret key,
// so a forged request can't fake a payment. Handles checkout.session.completed.
import { stripe, send, readJson, fail } from './_lib.js';
import { dbReady, processPaidSession, siteUrl } from './_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
    const body = await readJson(req);
    if (!/^evt_[A-Za-z0-9]+$/.test(body.id || '')) return send(res, 400, { error: 'Bad event' });
    const ev = await stripe('GET', `/events/${body.id}`);
    if (ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') {
      const s = await stripe('GET', `/checkout/sessions/${ev.data.object.id}`);
      if (dbReady()) await processPaidSession(s, process.env.SITE_URL || siteUrl(req));
    }
    send(res, 200, { received: true });
  } catch (e) { fail(res, e); }
}
