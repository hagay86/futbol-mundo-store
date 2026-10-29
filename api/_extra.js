// 26/27 + World Cup 2026 catalogue scraped from the partner store (mmjerseys) with each
// product's real sizes, name/number options and patches. Stored in Redis (keys cat:n,
// cat:0..n-1 hold one JSON string split in chunks) by /api/ingest, served by /api/catalog.
import { redis, dbReady } from './_db.js';

export const MARKUP = 1.8;
export const IMG = 'https://ssl.images-ssl-jupiter.com/99298/';
const r2 = v => Math.round(v * 100) / 100;
const up = v => r2(v * MARKUP);

const SKIP_BC = /^(Accessories|Casual Clothing|NBA|Clearance Sales)$/i;
const LEAGUE = { 'Premier League':'Premier League', 'La Liga':'La Liga', 'LaLiga Hypermotion':'La Liga', 'Serie A':'Serie A', 'Bundesliga':'Bundesliga', 'Ligue 1':'Ligue 1', 'International':'National Teams' };
const isWorldCup = n => /world\s*cup/i.test(n);
const isKids = n => /\bkids?\b|\bbaby\b|\binfant\b|\byouth\b/i.test(n);

// raw = {sets, rows}; row = [mid, name, priceUSD, league, team, gallery[], [[propName, setIndex]], customFlag]
export function transform(raw) {
  const out = [];
  if (raw && Array.isArray(raw.curated)) return raw.curated.filter(p => p && p.n && p.p > 0 && p.mid && Array.isArray(p.sz)).map(p => Object.assign({}, p, { x: 1, cur: 1 }));
  if (!raw || !Array.isArray(raw.rows)) return out;
  for (const [mid, name, price, bc0, bc1, gal, props] of raw.rows) {
    if (!name || !price || !gal || !gal.length || SKIP_BC.test(bc0 || '')) continue;
    const n = String(name).replace(/\s+/g, ' ').trim();
    if (/shorts|socks|jacket|hoodie|training/i.test(n)) continue;
    const g = LEAGUE[bc0] || 'Other Leagues';
    const c = isKids(n) ? 'Kids' : isWorldCup(n) ? 'World Cup 2026' : g;
    let sz = [];
    const opt = [];
    for (const [pn, si] of props || []) {
      const set = (raw.sets[si] || []).map(o => [String(o[0]).trim(), up(+o[1] || 0)].concat(o[2] ? [IMG + o[2]] : []));
      if (!set.length) continue;
      const label = /^name and numb/i.test(pn) ? 'Name and Number' : /^ads?\.?$/i.test(pn) ? 'Ad' : String(pn).trim();
      if (label === 'Size') sz = set.map(o => o[0]);
      else opt.push([label, set]);
    }
    if (!sz.length) continue;
    out.push({ c, t: bc1 || '', n, p: up(price), o: '', i: IMG + gal[0], gal: gal.map(x => IMG + x),
      l: `https://www.mmjerseys8.com/p${mid}.html`, g: g === 'National Teams' ? 'National Teams' : (bc0 || g), b: 'New', r: 9999, mid, sz, opt, x: 1 });
  }
  return out;
}

let CACHE = null, CACHE_AT = 0;
export async function extraProducts() {
  if (CACHE && Date.now() - CACHE_AT < 5 * 60 * 1000) return CACHE;
  if (!dbReady()) return CACHE || [];
  try {
    const n = +(await redis('GET', 'cat:n')) || 0;
    if (!n) return (CACHE = []);
    let s = '';
    for (let i = 0; i < n; i++) s += (await redis('GET', 'cat:' + i)) || '';
    CACHE = transform(JSON.parse(s)); CACHE_AT = Date.now();
  } catch (e) { console.log('[extra catalogue]', e.message); }
  return CACHE || [];
}

// Same merge runs in the browser (index.html): drop static items that the fresh feed replaces, append the feed.
export const midOf = p => p.mid || +((String(p.l || '').match(/-p(\d+)\.html/) || [])[1] || 0);
export function mergeCatalog(staticList, extra) {
  if (!extra.length) return staticList;
  if (extra[0].cur) return extra.slice();   // curated catalogue: only these products are sold
  const ids = new Set(extra.map(p => p.mid));
  return staticList.filter(p => !ids.has(midOf(p))).concat(extra);
}

// Add-on price for the options a buyer picked (USD, already marked up). Unknown choices cost nothing.
export const CUSTOM_NAME_FEE = up(2.93);
export function addonsFor(p, chosen, cname) {
  let add = 0;
  if (p.opt) {
    for (const [label, set] of p.opt) {
      const pick = chosen && chosen[label];
      const o = pick && set.find(x => x[0] === pick);
      if (o) add += o[1];
    }
  } else if (cname) add += CUSTOM_NAME_FEE;
  return r2(add);
}
