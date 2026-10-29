// Database (Upstash Redis over REST), sessions, email (Resend) and order processing.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { stripe, makeCode, SHIRT_POINTS } from './_lib.js';

// ---------------- Redis ----------------
const R_URL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const R_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
export const dbReady = () => !!(R_URL() && R_TOKEN());
export async function redis(...cmd) {
  if (!dbReady()) throw Object.assign(new Error('Accounts are being switched on. Please try again soon.'), { status: 503 });
  const r = await fetch(R_URL(), { method: 'POST', headers: { Authorization: 'Bearer ' + R_TOKEN(), 'Content-Type': 'application/json' }, body: JSON.stringify(cmd.map(String)) });
  const j = await r.json();
  if (j.error) throw Object.assign(new Error('Database error'), { status: 502 });
  return j.result;
}
export const getJSON = async k => { const v = await redis('GET', k); return v ? JSON.parse(v) : null; };
export const setJSON = (k, v, ...opt) => redis('SET', k, JSON.stringify(v), ...opt);

// ---------------- Users & sessions ----------------
export const normEmail = e => String(e || '').trim().toLowerCase();
export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length < 200;
export function hashPw(pw, salt = randomBytes(16).toString('hex')) { return { salt, hash: scryptSync(String(pw), salt, 64).toString('hex') }; }
export function checkPw(pw, u) { const h = scryptSync(String(pw), u.salt, 64); return timingSafeEqual(h, Buffer.from(u.hash, 'hex')); }
export const token = () => randomBytes(24).toString('base64url');
export const getUser = email => getJSON('user:' + normEmail(email));
export const saveUser = u => setJSON('user:' + u.email, u);
export const publicUser = u => u && ({ email: u.email, name: u.name, verified: !!u.verified, spent: u.spent || 0, created: u.created, welcome: !!u.welcome });

function cookies(req) { const o = {}; (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
export async function currentUser(req) {
  if (!dbReady()) return null;
  const t = cookies(req).fm_sess; if (!t || t.length > 64) return null;
  const email = await redis('GET', 'sess:' + t); if (!email) return null;
  return getUser(email);
}
export async function startSession(res, email) {
  const t = token();
  await redis('SET', 'sess:' + t, email, 'EX', 60 * 60 * 24 * 60);
  res.setHeader('Set-Cookie', `fm_sess=${t}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 60}`);
}
export async function endSession(req, res) {
  const t = cookies(req).fm_sess; if (t) await redis('DEL', 'sess:' + t).catch(() => {});
  res.setHeader('Set-Cookie', 'fm_sess=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
}

// ---------------- Email (Resend) ----------------
export const emailReady = () => !!process.env.RESEND_API_KEY;
const FROM = () => process.env.EMAIL_FROM || 'Futbol Mundo <hello@futbolmundoshop.com>';
export async function sendEmail({ to, subject, html, at }) {
  if (!emailReady()) { console.log('[email skipped: no RESEND_API_KEY]', subject, to); return { skipped: true }; }
  const body = { from: FROM(), to: [to], subject, html };
  if (at) body.scheduled_at = new Date(at).toISOString();
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) console.log('[email error]', r.status, JSON.stringify(j));
  return j;
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
export function emailLayout(title, inner, cta) {
  return `<!doctype html><html><body style="margin:0;background:#F4F6F3;font-family:Arial,Helvetica,sans-serif;color:#0F1E33">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F3;padding:24px 0"><tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
  <tr><td style="background:#0F1E33;padding:22px 28px;color:#E8B730;font-weight:900;font-size:20px;letter-spacing:1px">FUTBOL MUNDO</td></tr>
  <tr><td style="padding:28px"><h1 style="margin:0 0 14px;font-size:24px">${esc(title)}</h1>${inner}
  ${cta ? `<p style="margin:26px 0 6px"><a href="${esc(cta.url)}" style="background:#17804F;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;display:inline-block">${esc(cta.label)}</a></p>` : ''}
  </td></tr><tr><td style="padding:18px 28px;background:#F4F6F3;color:#4A5668;font-size:12px">Futbol Mundo · futbolmundoshop.com · Reply to this email if you need help.</td></tr></table></td></tr></table></body></html>`;
}
export const siteUrl = req => (req.headers['x-forwarded-proto'] || 'https') + '://' + (req.headers['x-forwarded-host'] || req.headers.host);

// ---------------- Orders ----------------
export const CODE_DELAY_MIN = 3;
// Idempotent: safe to call from the webhook and from the return page.
export async function processPaidSession(s, origin) {
  if (s.payment_status !== 'paid') return null;
  const key = 'order:' + s.id;
  const existing = await getJSON(key);
  if (existing) return existing;
  const fresh = await redis('SET', 'lock:' + key, '1', 'NX', 'EX', 120);
  if (!fresh) { await new Promise(r => setTimeout(r, 1200)); return getJSON(key); }
  const m = s.metadata || {};
  const shirts = +m.shirts || 0, pts = +m.pts || 0, scarf = m.scarf === '1';
  const codes = [];
  for (let i = 0; i < shirts; i++) codes.push({ code: makeCode('P', SHIRT_POINTS, `${s.id}:shirt:${i}`), label: `Shirt ${i + 1}: ${SHIRT_POINTS.toLocaleString('en-US')} Mundo Credits (Ɱ), one 6-player pack` });
  if (pts) codes.push({ code: makeCode('P', pts, `${s.id}:points`), label: `${pts.toLocaleString('en-US')} Mundo Credits (Ɱ) you bought` });
  if (scarf) codes.push({ code: makeCode('S', 0, `${s.id}:scarf`), label: 'Free scarf bonus: 1 Mundo XI player' });
  let items = s.items || [];
  if (!s.items) try { items = (await stripe('GET', `/checkout/sessions/${s.id}/line_items`, { limit: 50 })).data.map(l => ({ name: l.description, q: l.quantity, amount: l.amount_total / 100 })); } catch (e) {}
  const email = normEmail(m.uid || s.customer_details?.email);
  const sendAt = Date.now() + CODE_DELAY_MIN * 60000;
  const order = { id: s.id, order: m.order, email, total: (s.amount_total || 0) / 100, spent: (s.amount_subtotal || 0) / 100, scarf, items, codes, created: Date.now(), sendAt,
    ship: s.ship || s.shipping_details || s.collected_information?.shipping_details || null, provider: s.provider || 'stripe', status: 'Processing' };
  await setJSON(key, order);
  await redis('SET', 'ordernum:' + m.order, s.id);
  await redis('LPUSH', 'allorders', s.id);
  if (email) {
    await redis('LPUSH', 'orders:' + email, s.id);
    const u = await getUser(email);
    if (u) { u.spent = Math.round(((u.spent || 0) + order.spent) * 100) / 100; await saveUser(u); }
    const lines = items.map(i => `<tr><td style="padding:6px 0">${esc(i.name)} × ${i.q}</td><td align="right">$${i.amount.toFixed(2)}</td></tr>`).join('');
    await sendEmail({ to: s.customer_details?.email || email, subject: `Order ${m.order} confirmed`, html: emailLayout('Thanks for your order!', `<p>Order <b>${esc(m.order)}</b> is confirmed and being prepared.</p><table width="100%" style="font-size:14px;border-collapse:collapse">${lines}<tr><td style="padding-top:10px;border-top:1px solid #ddd"><b>Total</b></td><td align="right" style="padding-top:10px;border-top:1px solid #ddd"><b>$${order.total.toFixed(2)}</b></td></tr></table>${scarf ? '<p>🧣 A free club scarf ships with this order.</p>' : ''}${codes.length ? `<p>Your Mundo XI player codes arrive in a separate email in about ${CODE_DELAY_MIN} minutes.</p>` : ''}`, { url: origin + '/#account', label: 'View my order' }) });
    if (codes.length) await sendEmail({ to: s.customer_details?.email || email, at: sendAt, subject: `Your Mundo XI codes are here (${m.order})`, html: emailLayout('Your players are ready', `<p>Redeem these in Mundo XI to open your packs. Each code works once.</p>${codes.map(c => `<div style="background:#0F1E33;color:#fff;border-radius:12px;padding:14px 16px;margin:10px 0"><div style="font-family:Courier New,monospace;font-size:18px;font-weight:bold;color:#E8B730;letter-spacing:1px">${esc(c.code)}</div><div style="font-size:13px;color:#AEB9C7;margin-top:4px">${esc(c.label)}</div></div>`).join('')}`, { url: origin + '/#game/redeem', label: 'Open Mundo XI' }) });
  }
  if (process.env.ADMIN_EMAIL) {
    const sh = order.ship; const addr = sh ? [sh.name, sh.phone && 'Phone: ' + sh.phone, sh.address?.line1, sh.address?.line2, sh.address?.postal_code + ' ' + sh.address?.city, sh.address?.state, sh.address?.country].filter(Boolean).map(esc).join('<br>') : 'Digital only';
    await sendEmail({ to: process.env.ADMIN_EMAIL, subject: `New order ${m.order} · $${order.total.toFixed(2)}`, html: emailLayout(`New order ${m.order}`, `<p><b>Customer:</b> ${esc(s.customer_details?.email || email)}</p><p><b>Ship to:</b><br>${addr}</p><p><b>Items</b> (sizes and printing are in Stripe → Payments → metadata):<br>${items.map(i => `${esc(i.name)} × ${i.q}`).join('<br>')}</p><p><b>Details:</b> ${esc(m.items || '')}</p>${scarf ? '<p><b>Include a FREE club scarf.</b></p>' : ''}`) });
  }
  return order;
}
