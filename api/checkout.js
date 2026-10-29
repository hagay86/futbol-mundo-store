// POST /api/checkout  → creates a PayPal order (when PayPal is connected) or a Stripe Checkout Session, and returns the payment page URL.
// Prices are always taken from the catalogue on the server, never from the browser.
import { randomBytes } from 'node:crypto';
import { catalog, ensureCatalog, findProduct, stripe, send, readJson, fail, SCARF_THRESHOLD, FREE_SHIP_OVER, SHIPPING } from './_lib.js';
import { dbReady, currentUser, setJSON } from './_db.js';
import { paypalReady, createPaypalOrder } from './_paypal.js';
import { addonsFor } from './_extra.js';

const COUNTRIES = ['US','CA','MX','GB','IE','FR','DE','ES','PT','IT','NL','BE','LU','AT','CH','DK','SE','NO','FI','IS','PL','CZ','SK','HU','SI','HR','RO','BG','GR','CY','MT','EE','LV','LT','IL','AE','SA','QA','KW','BH','OM','JO','TR','AU','NZ','JP','KR','SG','HK','TW','MY','TH','PH','ID','VN','IN','ZA','NG','KE','EG','MA','BR','AR','CL','CO','PE','UY','PY','EC','CR','PA','DO','GT','JM','PR'];
const cents = v => Math.round(+v * 100);
const clampQ = q => Math.max(1, Math.min(20, parseInt(q, 10) || 1));
const clean = (s, n = 40) => String(s || '').replace(/[^\p{L}\p{N} .'#\-()/+]/gu, '').slice(0, n).trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  try {
    const user = await currentUser(req);
    if (dbReady() && !user) return send(res, 401, { error: 'Please sign in or create an account to check out' });
    const body = await readJson(req);
    const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
    if (!items.length) return send(res, 400, { error: 'Your bag is empty' });
    await ensureCatalog();
    const { boxes, packs } = catalog();

    const line_items = [], lines = [];
    let merch = 0, shirts = 0, pts = 0, physical = false;
    const summary = [];
    for (const it of items) {
      const q = clampQ(it.q);
      if (it.kind === 'points') continue; // Mundo Credits are no longer sold
      if (false) {
        const price = packs[+it.pts];
        if (!price) continue;
        pts += +it.pts * q;
        lines.push({ name: `${(+it.pts).toLocaleString('en-US')} Mundo Credits`, desc: 'Digital: code emailed after payment', cents: cents(price), q, digital: true });
        line_items.push({ quantity: q, price_data: { currency: 'usd', unit_amount: cents(price), product_data: { name: `${(+it.pts).toLocaleString('en-US')} Mundo Credits (Ɱ)`, description: 'Digital: Mundo Credits code emailed to you after payment' } } });
        summary.push(`${q}x ${it.pts} pts`);
      } else if (it.kind === 'box') {
        const b = boxes[+it.box];
        if (!b) continue;
        physical = true; merch += cents(b.price) * q; shirts += b.n * q;
        const desc = `Size${b.n > 1 ? 's' : ''} ${clean(it.sz, 40)} · ${clean(it.league, 30) || 'Any league'} · includes ${b.n}x 6-player Mundo XI packs`;
        lines.push({ name: `${b.name} mystery box (${b.n} shirt${b.n > 1 ? 's' : ''})`, desc, cents: cents(b.price), q });
        line_items.push({ quantity: q, price_data: { currency: 'usd', unit_amount: cents(b.price), product_data: { name: `${b.name} mystery box (${b.n} shirt${b.n > 1 ? 's' : ''})`, description: desc } } });
        summary.push(`${q}x box${b.n} ${clean(it.sz, 40)} ${clean(it.league, 20)}`);
      } else {
        const p = findProduct(+it.pid, String(it.n || ''));
        if (!p) continue;
        const opts = {};
        if (p.opt && it.opts && typeof it.opts === 'object') for (const [label, set] of p.opt) { const v = String(it.opts[label] || ''); if (set.some(o => o[0] === v)) opts[label] = v; }
        const cname = clean(it.cname, 18);
        const unit = cents(p.p + addonsFor(p, opts, cname));
        physical = true; merch += unit * q; if (p.shirt) shirts += q;
        const print = cname ? ` · Print: ${cname.toUpperCase()} #${clean(it.cnum, 3)}` : '';
        const extras = Object.entries(opts).filter(([, v]) => !/^no\b/i.test(v)).map(([k, v]) => ` · ${k}: ${v}`).join('');
        const desc = `Size ${clean(it.sz, 14)}${extras}${print}${p.shirt ? ' · includes a 6-player Mundo XI pack' : ''}`.slice(0, 480);
        const pd = { name: p.n.slice(0, 250), description: desc };
        lines.push({ name: p.n, desc, cents: unit, q });
        if (/^https:\/\//.test(p.i)) pd.images = [p.i];
        line_items.push({ quantity: q, price_data: { currency: 'usd', unit_amount: unit, product_data: pd } });
        summary.push(`${q}x #${p.id} ${clean(it.sz, 12)}${extras}${print}`);
      }
    }
    if (!line_items.length) return send(res, 400, { error: 'Nothing in your bag can be bought right now' });

    const scarf = merch >= SCARF_THRESHOLD * 100;
    const order = 'FM-' + randomBytes(4).toString('hex').toUpperCase().slice(0, 7);
    const origin = (req.headers['x-forwarded-proto'] || 'https') + '://' + (req.headers['x-forwarded-host'] || req.headers.host);
    const meta = { order, shirts: String(shirts), pts: String(pts), scarf: scarf ? '1' : '0', merch: String(merch), uid: user ? user.email : '', items: summary.join(' | ').slice(0, 490) };

    const params = {
      mode: 'payment',
      line_items: Object.fromEntries(line_items.map((l, i) => [i, l])),
      success_url: `${origin}/?order={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#bag`,
      allow_promotion_codes: 'true',
      locale: 'auto',
      billing_address_collection: 'auto',
      metadata: meta,
      customer_email: user ? user.email : undefined,
      payment_intent_data: {
        description: `Futbol Mundo ${order}${scarf ? ' · includes FREE club scarf' : ''}`,
        metadata: Object.assign({}, meta, { status: 'Processing' }),
      },
      custom_text: scarf ? { submit: { message: 'Your order qualifies for a FREE club scarf and a bonus Mundo XI player.' } } : undefined,
    };
    if (physical) {
      params.shipping_address_collection = { allowed_countries: Object.fromEntries(COUNTRIES.map((c, i) => [i, c])) };
      params.phone_number_collection = { enabled: 'true' };
      const opt = (name, amount, lo, hi) => ({ shipping_rate_data: { type: 'fixed_amount', display_name: name, fixed_amount: { amount, currency: 'usd' }, delivery_estimate: { minimum: { unit: 'business_day', value: lo }, maximum: { unit: 'business_day', value: hi } } } });
      params.shipping_options = {
        0: opt(merch >= FREE_SHIP_OVER * 100 ? 'Standard delivery (free)' : 'Standard delivery', merch >= FREE_SHIP_OVER * 100 ? 0 : SHIPPING.standard, 5, 7),
        1: opt('Express delivery', SHIPPING.express, 2, 3),
        2: opt('Next-day delivery', SHIPPING.overnight, 1, 1),
      };
    }
    if (paypalReady()) {
      const method = ['standard', 'express', 'overnight'].includes(body.ship) ? body.ship : 'standard';
      const shippingCents = !physical ? 0 : method === 'standard' && merch >= FREE_SHIP_OVER * 100 ? 0 : SHIPPING[method];
      const lang = String(body.lang || '').slice(0, 2);
      const LOC = { en:'en-US', es:'es-ES', pt:'pt-BR', fr:'fr-FR', de:'de-DE', it:'it-IT', he:'he-IL', ar:'ar-EG' };
      const pp = await createPaypalOrder({ order, lines, shippingCents, physical, email: user && user.email, origin, locale: LOC[lang], card: body.pay !== 'paypal', sdk: !!body.sdk });
      if (!pp.url && !body.sdk) return send(res, 502, { error: 'PayPal did not return a payment page. Please try again' });
      const subtotal = lines.reduce((t, l) => t + l.cents * l.q, 0);
      if (dbReady()) await setJSON('pp:' + pp.id, { meta: Object.assign({}, meta, { ship: method }), lines: lines.map(l => ({ name: l.name, q: l.q, amount: l.cents * l.q / 100 })), subtotal, shippingCents }, 'EX', 60 * 60 * 24 * 3);
      return send(res, 200, { url: pp.url, id: pp.id, order, provider: 'paypal' });
    }
    const session = await stripe('POST', '/checkout/sessions', params);
    send(res, 200, { url: session.url, order });
  } catch (e) { fail(res, e); }
}
