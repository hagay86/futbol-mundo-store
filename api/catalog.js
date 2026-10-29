// GET /api/catalog → JavaScript that defines window.EXTRA_PRODUCTS (the 26/27 + World Cup feed).
// Loaded by index.html before the shop code; cached at Vercel's edge.
import { extraProducts } from './_extra.js';

export default async function handler(req, res) {
  let list = [];
  try { list = await extraProducts(); } catch (e) {}
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', list.length ? 'public, s-maxage=300, stale-while-revalidate=86400' : 'no-store');
  res.end('window.EXTRA_PRODUCTS=' + JSON.stringify(list).replace(/</g, '\\u003c') + ';');
}
