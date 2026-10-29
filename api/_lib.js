// Shared helpers for the Futbol Mundo API (Vercel serverless functions).
// Prices are read straight from index.html so the site stays the single source of truth.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHmac, createHash } from 'node:crypto';

// ---------- Game economy (keep in sync with index.html) ----------
export const SHIRT_POINTS = 4000;        // enough for one 6-player Gold pack
export const SCARF_THRESHOLD = 30;       // USD of merchandise for the free scarf
export const FREE_SHIP_OVER = 99;
export const SHIPPING = { standard: 999, express: 1499, overnight: 2999 }; // cents

let CATALOG = null;
export function catalog() {
  if (CATALOG) return CATALOG;
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  const a = html.indexOf('const PRODUCTS = ') + 'const PRODUCTS = '.length;
  const b = html.indexOf('];\n', a) + 1;
  const products = JSON.parse(html.slice(a, b));
  products.forEach((p, i) => { p.id = i; p.shirt = isShirt(p); });
  const boxes = {};
  const boxRe = /\{n:(\d), name:'([^']+)',\s*price:([\d.]+)/g; let m;
  while ((m = boxRe.exec(html))) boxes[+m[1]] = { n: +m[1], name: m[2], price: +m[3] };
  const pp = html.match(/const POINT_PACKS = (\[.*?\]);/);
  const packs = {};
  if (pp) for (const x of pp[1].matchAll(/pts:(\d+), price:([\d.]+)/g)) packs[+x[1]] = +x[2];
  CATALOG = { products, byName: groupByName(products), boxes, packs };
  return CATALOG;
}
function groupByName(list) { const o = {}; list.forEach(p => { (o[p.n] ||= []).push(p); }); return o; }
export function isShirt(p) {
  if (['Shoes', 'Accessories'].includes(p.c)) return false;
  return /jersey|shirt|kit|suit/i.test(p.n) && !/short|sock|bottle|case|mat\b|blanket|scarf|cap\b|hat\b|bag\b|pants|trouser/i.test(p.n);
}
export function findProduct(pid, name) {
  const { products, byName } = catalog();
  const p = products[pid];
  if (p && p.n === name) return p;
  const list = byName[name];
  if (!list) return null;
  return list.slice().sort((x, y) => y.p - x.p)[0]; // highest price if the name repeats
}

// ---------- Stripe (plain REST, no SDK) ----------
export function stripeKey() {
  if (process.env.STRIPE_LIVE_SECRET_KEY) return process.env.STRIPE_LIVE_SECRET_KEY.trim();
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY.trim();
  // Fallback: a variable that was saved with the key itself as its name.
  const named = Object.keys(process.env).find(k => /^sk_(live|test)_[A-Za-z0-9]+$/.test(k));
  return named ? (/^sk_(live|test)_/.test(process.env[named] || '') ? process.env[named].trim() : named) : '';
}
function formEncode(obj, prefix, out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') formEncode(v, key, out);
    else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(v));
  }
  return out.join('&');
}
export async function stripe(method, path, params) {
  const key = stripeKey();
  if (!key) throw Object.assign(new Error('Stripe is not connected yet'), { status: 503 });
  let url = 'https://api.stripe.com/v1' + path;
  const init = { method, headers: { Authorization: 'Bearer ' + key } };
  if (params && method === 'GET') url += (url.includes('?') ? '&' : '?') + formEncode(params);
  else if (params) { init.body = formEncode(params); init.headers['Content-Type'] = 'application/x-www-form-urlencoded'; }
  const r = await fetch(url, init);
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(j.error?.message || 'Stripe error'), { status: r.status >= 500 ? 502 : 400 });
  return j;
}

// ---------- Signed Mundo XI codes ----------
// Format: MX-TAAA-NNNN-SSSSSSSS  (T = type, AAA = amount/100 in base36, N = nonce, S = signature)
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const secretSeed = () => process.env.CODE_SECRET || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.PAYPAL_SECRET || stripeKey();
function secret() { return createHash('sha256').update('fm-codes:' + secretSeed()).digest(); }
function b32(buf, n) { let s = ''; for (let i = 0; i < n; i++) s += ALPHA[buf[i] % 32]; return s; }
function sign(body) { return b32(createHmac('sha256', secret()).update(body).digest(), 8); }
export function makeCode(type, amount, seed) {
  const head = type + Math.round(amount / 100).toString(36).toUpperCase().padStart(3, '0');
  const nonce = b32(createHash('sha256').update(seed).digest(), 4);
  return `MX-${head}-${nonce}-${sign(head + '-' + nonce)}`;
}
export function readCode(code) {
  const m = /^MX-([PS])([0-9A-Z]{3})-([A-Z2-9]{4})-([A-Z2-9]{8})$/.exec(String(code || '').trim().toUpperCase());
  if (!m || !secretSeed()) return null;
  if (sign(m[1] + m[2] + '-' + m[3]) !== m[4]) return null;
  return { type: m[1] === 'P' ? 'points' : 'scarf', amount: parseInt(m[2], 36) * 100 };
}

// ---------- tiny response helpers ----------
export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = ''; for await (const c of req) raw += c;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}
export const fail = (res, e) => send(res, e.status || 500, { error: e.status ? e.message : 'Something went wrong. Please try again.' });
