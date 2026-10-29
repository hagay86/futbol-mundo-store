// PayPal Orders v2 (redirect flow, no SDK). Buyers can pay with a PayPal account or as a guest with a card.
// Env: PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_ENV ('sandbox' for testing; anything else = live).
// The Client ID is public by design (PayPal exposes it in browsers); only PAYPAL_SECRET must stay private.
const LIVE_CLIENT_ID = 'BAAcpWVZSv030wUMQde4l21vlth1TeSvuvPbdXFnGPizDEtGHgsZb30mS_RtaHxOGO5wgkDejjGFoXoiuk';
const clientId = () => (process.env.PAYPAL_CLIENT_ID || LIVE_CLIENT_ID).trim();
export const paypalReady = () => { const sec = (process.env.PAYPAL_SECRET || '').trim(); return !!(clientId() && sec && sec !== clientId()); };
export const paypalClientId = () => clientId();
export const paypalMode = () => (process.env.PAYPAL_ENV || '').toLowerCase().startsWith('sand') ? 'sandbox' : 'live';
const BASE = () => paypalMode() === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

let TOKEN = null;
async function token() {
  if (TOKEN && TOKEN.exp > Date.now() + 60000) return TOKEN.v;
  const r = await fetch(BASE() + '/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(clientId() + ':' + process.env.PAYPAL_SECRET.trim()).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error('PayPal login failed: ' + (j.error_description || j.error || r.status)), { status: 502 });
  TOKEN = { v: j.access_token, exp: Date.now() + (j.expires_in || 3000) * 1000 };
  return TOKEN.v;
}
export async function paypalCheck(){ try { await token(); return true; } catch (e) { return e.message; } }
export const paypalInfo = () => { const s = (process.env.PAYPAL_SECRET || '').trim(); return { secretLength: s.length, secretLooksLikeClientId: s === clientId(), secretHasSpaces: /\s/.test(process.env.PAYPAL_SECRET || '') }; };
export async function paypal(method, path, body, extraHeaders = {}) {
  const r = await fetch(BASE() + path, { method, headers: Object.assign({ Authorization: 'Bearer ' + await token(), 'Content-Type': 'application/json' }, extraHeaders), body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const issue = j.details?.[0]?.issue || j.name || 'PAYPAL_ERROR';
    throw Object.assign(new Error(j.details?.[0]?.description || j.message || 'PayPal error'), { status: r.status >= 500 ? 502 : 400, issue });
  }
  return j;
}
const usd = c => (c / 100).toFixed(2);
const cut = (s, n) => String(s || '').slice(0, n);

// lines: [{name, desc, cents, q, digital}]  → returns {id, url}
export async function createPaypalOrder({ order, lines, shippingCents, physical, email, origin, locale, card, sdk, addr }, plain) {
  const itemTotal = lines.reduce((s, l) => s + l.cents * l.q, 0);
  const body = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: order, invoice_id: order + '-' + Date.now().toString(36), description: cut(`Futbol Mundo ${order}`, 127),
      amount: { currency_code: 'USD', value: usd(itemTotal + shippingCents), breakdown: { item_total: { currency_code: 'USD', value: usd(itemTotal) }, shipping: { currency_code: 'USD', value: usd(shippingCents) } } },
      items: lines.map(l => ({ name: cut(l.name, 127), description: cut(l.desc, 127), quantity: String(l.q), unit_amount: { currency_code: 'USD', value: usd(l.cents) }, category: l.digital ? 'DIGITAL_GOODS' : 'PHYSICAL_GOODS' })),
    }],
    ...(sdk ? {
      // On-page buttons (JS SDK): the buyer picks card or PayPal in the button itself, so no payment_source here.
      application_context: { brand_name: 'Futbol Mundo', user_action: 'PAY_NOW', shipping_preference: physical ? 'GET_FROM_FILE' : 'NO_SHIPPING', locale: locale || undefined },
    } : { payment_source: { paypal: { experience_context: {
      brand_name: 'Futbol Mundo', user_action: 'PAY_NOW', landing_page: card ? 'GUEST_CHECKOUT' : 'LOGIN',
      shipping_preference: physical ? 'GET_FROM_FILE' : 'NO_SHIPPING',
      locale: locale || undefined,
      return_url: `${origin}/?pp=1`, cancel_url: `${origin}/#bag`,
    }, email_address: email || undefined } } }),
  };
  // Prefill the buyer's country and delivery address from our form (falls back to PayPal's own form if PayPal rejects it)
  if (addr && !plain) {
    const pa = { address_line_1: addr.line1.slice(0, 300), admin_area_2: addr.city.slice(0, 120), country_code: addr.country };
    if (addr.line2) pa.address_line_2 = addr.line2.slice(0, 300);
    if (addr.state) pa.admin_area_1 = addr.state.slice(0, 300);
    if (addr.zip) pa.postal_code = addr.zip.slice(0, 60);
    if (physical) body.purchase_units[0].shipping = { name: { full_name: addr.name.slice(0, 300) }, address: pa };
    const [given, ...rest] = addr.name.split(' ');
    if (sdk) { body.application_context.shipping_preference = physical ? 'SET_PROVIDED_ADDRESS' : 'NO_SHIPPING'; body.payer = { name: { given_name: given.slice(0, 140), surname: (rest.join(' ') || given).slice(0, 140) }, address: { country_code: addr.country }, email_address: email || undefined }; }
    else body.payment_source.paypal.experience_context.shipping_preference = physical ? 'SET_PROVIDED_ADDRESS' : 'NO_SHIPPING';
  }
  let j;
  try { j = await paypal('POST', '/v2/checkout/orders', body, { 'PayPal-Request-Id': order + (plain ? '-p' : '') }); }
  catch (e) { if (addr && !plain && e.status === 400) return createPaypalOrder({ order, lines, shippingCents, physical, email, origin, locale, card, sdk, addr }, true); throw e; }
  const link = (j.links || []).find(l => l.rel === 'payer-action' || l.rel === 'approve');
  return { id: j.id, url: link && link.href };
}

// Capture (idempotent). Returns the order object when COMPLETED, else null.
export async function capturePaypalOrder(id) {
  let o;
  try { o = await paypal('POST', `/v2/checkout/orders/${id}/capture`, {}, { Prefer: 'return=representation', 'PayPal-Request-Id': 'cap-' + id }); }
  catch (e) { if (e.issue === 'ORDER_ALREADY_CAPTURED') o = await paypal('GET', `/v2/checkout/orders/${id}`); else throw e; }
  const cap = o.purchase_units?.[0]?.payments?.captures?.[0];
  return o.status === 'COMPLETED' && cap && cap.status !== 'DECLINED' ? o : null;
}
export function paypalShip(o) {
  const s = o.purchase_units?.[0]?.shipping; if (!s) return null;
  const a = s.address || {};
  return { name: s.name?.full_name || '', address: { line1: a.address_line_1, line2: a.address_line_2, city: a.admin_area_2, state: a.admin_area_1, postal_code: a.postal_code, country: a.country_code } };
}
