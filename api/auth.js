// /api/auth?action=signup|login|logout|me|verify|forgot|reset|welcome|gift
import { send, readJson, fail } from './_lib.js';
import { redis, dbReady, getUser, saveUser, normEmail, validEmail, hashPw, checkPw, token, publicUser, currentUser, startSession, endSession, sendEmail, emailLayout, siteUrl, getJSON } from './_db.js';

const GIFTS = { 'Club scarf': 9000, 'Match ball': 18000, 'Free jersey': 30000, 'Hat-trick box': 60000, 'Signed shirt draw': 105000 };

async function limited(key, max, secs) {
  const n = await redis('INCR', 'rl:' + key);
  if (n === 1) await redis('EXPIRE', 'rl:' + key, secs);
  return n > max;
}

export default async function handler(req, res) {
  try {
    const action = new URL(req.url, 'http://x').searchParams.get('action');
    const body = req.method === 'POST' ? await readJson(req) : {};
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x';
    const origin = siteUrl(req);

    if (action === 'me') {
      if (!dbReady()) return send(res, 200, { user: null, ready: false });
      const u = await currentUser(req);
      if (!u) return send(res, 200, { user: null, ready: true });
      const ids = await redis('LRANGE', 'orders:' + u.email, 0, 30);
      const orders = [];
      for (const id of ids || []) {
        const o = await getJSON('order:' + id); if (!o) continue;
        orders.push({ order: o.order, total: o.total, created: o.created, status: o.status, items: o.items, scarf: o.scarf, codes: Date.now() >= o.sendAt ? o.codes : null, sendAt: o.sendAt });
      }
      return send(res, 200, { user: publicUser(u), orders, ready: true });
    }
    if (action === 'verify') {
      const t = new URL(req.url, 'http://x').searchParams.get('t') || '';
      const email = t && await redis('GET', 'verify:' + t);
      if (email) { const u = await getUser(email); if (u) { u.verified = true; await saveUser(u); } await redis('DEL', 'verify:' + t); }
      res.statusCode = 302; res.setHeader('Location', '/#' + (email ? 'verified' : 'verify-expired')); return res.end();
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });

    if (action === 'signup') {
      const email = normEmail(body.email), name = String(body.name || '').trim().slice(0, 40), pw = String(body.password || '');
      if (!validEmail(email)) return send(res, 400, { error: 'Enter a valid email address' });
      if (pw.length < 8) return send(res, 400, { error: 'Use at least 8 characters for your password' });
      if (await limited('su:' + ip, 10, 3600)) return send(res, 429, { error: 'Too many sign-ups. Try again later' });
      const ok = await redis('SET', 'user:' + email, JSON.stringify({ email, name, ...hashPw(pw), verified: false, spent: 0, created: Date.now() }), 'NX');
      if (!ok) return send(res, 409, { error: 'That email already has an account. Sign in instead' });
      await startSession(res, email);
      // free monthly jersey giveaway: one entry per new account, no purchase needed
      try { await redis('LPUSH', 'giveaway:' + new Date().toISOString().slice(0, 7), email); } catch (e) {}
      const vt = token(); await redis('SET', 'verify:' + vt, email, 'EX', 172800);
      await sendEmail({ to: email, subject: 'Welcome to Futbol Mundo: confirm your email', html: emailLayout(`Welcome${name ? ', ' + name : ''}!`, '<p>Your manager account is ready. Confirm your email, then head to Mundo XI to open your welcome pack.</p><p>Every shirt you buy comes with a 6-player pack, and orders over $30 include a free club scarf.</p>', { url: `${origin}/api/auth?action=verify&t=${vt}`, label: 'Confirm my email' }) });
      return send(res, 200, { user: publicUser(await getUser(email)) });
    }
    if (action === 'login') {
      const email = normEmail(body.email);
      if (await limited('li:' + email, 10, 900)) return send(res, 429, { error: 'Too many attempts. Wait 15 minutes or reset your password' });
      const u = await getUser(email);
      if (!u || !checkPw(body.password || '', u)) return send(res, 401, { error: 'Wrong email or password' });
      await startSession(res, email);
      return send(res, 200, { user: publicUser(u) });
    }
    if (action === 'logout') { await endSession(req, res); return send(res, 200, { ok: true }); }
    if (action === 'forgot') {
      const email = normEmail(body.email);
      if (validEmail(email) && !(await limited('fp:' + email, 3, 3600))) {
        const u = await getUser(email);
        if (u) { const t = token(); await redis('SET', 'reset:' + t, email, 'EX', 3600);
          await sendEmail({ to: email, subject: 'Reset your Futbol Mundo password', html: emailLayout('Reset your password', '<p>Click below to choose a new password. The link works for 1 hour. If you did not ask for this, ignore this email.</p>', { url: `${origin}/#reset=${t}`, label: 'Choose a new password' }) }); }
      }
      return send(res, 200, { ok: true });
    }
    if (action === 'reset') {
      const t = String(body.token || ''), pw = String(body.password || '');
      if (pw.length < 8) return send(res, 400, { error: 'Use at least 8 characters for your password' });
      const email = await redis('GET', 'reset:' + t);
      if (!email) return send(res, 400, { error: 'This reset link has expired. Ask for a new one' });
      const u = await getUser(email); Object.assign(u, hashPw(pw)); await saveUser(u); await redis('DEL', 'reset:' + t);
      await startSession(res, email);
      return send(res, 200, { user: publicUser(u) });
    }
    const u = await currentUser(req);
    if (!u) return send(res, 401, { error: 'Please sign in first' });
    if (action === 'welcome') {
      if (u.welcome) return send(res, 200, { granted: false });
      u.welcome = Date.now(); await saveUser(u);
      return send(res, 200, { granted: true });
    }
    if (action === 'gift') {
      const name = String(body.name || ''), cost = GIFTS[name];
      if (!cost) return send(res, 400, { error: 'Unknown gift' });
      if ((u.spent || 0) < 30) return send(res, 403, { error: 'Gifts unlock after you spend $30 in the shop' });
      const claim = 'GF-' + token().slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
      await redis('LPUSH', 'gifts', JSON.stringify({ claim, email: u.email, name, at: Date.now() }));
      await sendEmail({ to: u.email, subject: `Gift claimed: ${name}`, html: emailLayout('Your gift is on its way', `<p>We received your claim <b>${claim}</b> for: <b>${name}</b>.</p><p>Reply to this email with your shipping address (if we don't have it from an order yet) and we'll send it out.</p>`) });
      if (process.env.ADMIN_EMAIL) await sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Gift claim ${claim}: ${name}`, html: emailLayout('New gift claim', `<p>${u.email} claimed <b>${name}</b> (Ɱ${cost.toLocaleString()} Mundo Credits). Claim ID ${claim}. Total spent: $${(u.spent || 0).toFixed(2)}.</p>`) });
      return send(res, 200, { claim });
    }
    send(res, 400, { error: 'Unknown action' });
  } catch (e) { fail(res, e); }
}
