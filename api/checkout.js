// POST /api/checkout  → creates a Stripe Checkout Session and returns its URL.
// Prices are always taken from the catalogue on the server, never from the browser.
import { randomBytes } from 'node:crypto';
import { catalog, findProduct, stripe, send, readJson, fail, SCARF_THRESHOLD, FREE_SHIP_OVER, SHIPPING } from './_lib.js';
import { dbReady, currentUser } from './_db.js';

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
    const { boxes, packs } = catalog();

    const line_items = [];
    let merch = 0, shirts = 0, pts = 0, physical = false;
    const summary = [];
    for (const it of items) {
      const q = clampQ(it.q);
      if (it.kind === 'points') {
        const price = packs[+it.pts];
        if (!price) continue;
        pts += +it.pts * q;
        line_items.push({ quantity: q, price_data: { currency: 'usd', unit_amount: cents(price), product_data: { name: `${(+it.pts).toLocaleString('en-US')} Mundo Credits (Ɱ)`, description: 'Digital: Mundo Credits code emailed to you after payment' } } });
        summary.push(`${q}x ${it.pts} pts`);
      } else if (it.kind === 'box') {
        const b = boxes[+it.box];
        if (!b) continue;
        physical = true; merch += cents(b.price) * q; shirts += b.n * q;
        const desc = `Size ${clean(it.sz, 12)} · ${clean(it.league, 30) || 'Any league'} · includes ${b.n}x 6-player Mundo XI packs`;
        line_items.push({ quantity: q, price_data: { currency: 'usd', unit_amount: cents(b.price), product_data: { name: `${b.name} mystery box (${b.n} shirt${b.n > 1 ? 's' : ''})`, description: desc } } });
        summary.push(`${q}x box${b.n} ${clean(it.sz, 12)} ${clean(it.league, 20)}`);
      } else {
        const p = findProduct(+it.pid, String(it.n || ''));
        if (!p) continue;
        physical = true; merch += cents(p.p) * q; if (p.shirt) shirts += q;
        const print = clean(it.cname, 18) ? ` · Print: ${clean(it.cname, 18).toUpperCase()} #${clean(it.cnum, 3)}` : '';
        const desc = `Size ${clean(it.sz, 14)}${print}${p.shirt ? ' · includes a 6-player Mundo XI pack' : ''}`;
        const pd = { name: p.n.slice(0, 250), description: desc };
        if (/^https:\/\//.test(p.i)) pd.images = [p.i];
        line_items.push({ quantity: q, price_data: { currency: 'usd', unit_amount: cents(p.p), product_data: pd } });
        summary.push(`${q}x #${p.id} ${clean(it.sz, 12)}${print}`);
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
    const session = await stripe('POST', '/checkout/sessions', params);
    send(res, 200, { url: session.url, order });
  } catch (e) { fail(res, e); }
}
