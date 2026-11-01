// /api/auth?action=signup|login|logout|me|verify|forgot|reset|welcome|gift
import { send, readJson, fail } from './_lib.js';
import { newGift, publicGifts } from './_gifts.js';
import { redis, dbReady, getUser, saveUser, normEmail, validEmail, hashPw, checkPw, token, publicUser, currentUser, startSession, endSession, sendEmail, emailLayout, siteUrl, getJSON } from './_db.js';

// Gift shop (Mundo Credits). Jersey and ball gifts go to "My gifts" and ship free with an order of $GIFT_MIN or more.
const GIFTS = { 'Match ball': { cost: 18000, kind: 'ball' }, 'Free jersey': { cost: 30000, kind: 'jersey', n: 1 }, 'Hat-trick box': { cost: 60000, kind: 'jersey', n: 3 }, 'Signed shirt draw': { cost: 105000, kind: 'draw' } };

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
      if (u.welcome && !u.welcomeGift) { u.gifts = u.gifts || []; u.gifts.push(newGift('Free jersey', 'jersey', 1, 'welcome')); u.welcomeGift = Date.now(); await saveUser(u); }
      const ids = await redis('LRANGE', 'orders:' + u.email, 0, 30);
      const orders = [];
      for (const id of ids || []) {
        const o = await getJSON('order:' + id); if (!o) continue;
        orders.push({ order: o.order, total: o.total, created: o.created, status: o.status, items: o.items, spent: o.spent, ship: o.ship ? { name: o.ship.name, city: o.ship.address?.city, country: o.ship.address?.country } : null, scarf: o.scarf, codes: Date.now() >= o.sendAt ? o.codes : null, sendAt: o.sendAt });
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
      if (body.terms === false) return send(res, 400, { error: 'Please accept the Terms of Service and Privacy Policy to continue.' });
      if (await limited('su:' + ip, 10, 3600)) return send(res, 429, { error: 'Too many sign-ups. Try again later' });
      const ok = await redis('SET', 'user:' + email, JSON.stringify({ email, name, ...hashPw(pw), verified: false, spent: 0, created: Date.now(), termsAccepted: body.terms ? { at: Date.now(), version: '2026-10-29' } : null }), 'NX');
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
      u.welcome = Date.now();
      const gift = newGift('Free jersey', 'jersey', 1, 'welcome');
      u.gifts = u.gifts || []; u.gifts.push(gift); u.welcomeGift = Date.now();
      await saveUser(u);
      return send(res, 200, { granted: true, gift, gifts: publicGifts(u) });
    }
    if (action === 'gift') {
      const name = String(body.name || ''), g = GIFTS[name];
      if (!g) return send(res, 400, { error: 'Unknown gift' });
      // each gift-shop gift can be taken once per account (not advertised; the shop hides it afterwards)
      u.giftsBought = u.giftsBought || [];
      if (u.giftsBought.includes(name)) return send(res, 409, { error: 'This gift is not available right now', gone: name, bought: u.giftsBought });
      u.giftsBought.push(name); await saveUser(u);
      if (g.kind !== 'draw') {
        const gift = newGift(name, g.kind, g.n || 1, 'shop');
        u.gifts = u.gifts || []; u.gifts.push(gift); await saveUser(u);
        return send(res, 200, { gift, gifts: publicGifts(u), bought: u.giftsBought });
      }
      const claim = 'GF-' + token().slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
      await redis('LPUSH', 'gifts', JSON.stringify({ claim, email: u.email, name, at: Date.now() }));
      await sendEmail({ to: u.email, subject: `You're in the draw: ${name}`, html: emailLayout('You are in the draw', `<p>Your entry <b>${claim}</b> for the <b>${name}</b> is in. We'll email you if you win.</p>`) });
      if (process.env.ADMIN_EMAIL) await sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Draw entry ${claim}: ${name}`, html: emailLayout('New draw entry', `<p>${u.email} entered <b>${name}</b> (Ɱ${g.cost.toLocaleString()}). Entry ${claim}.</p>`) });
      return send(res, 200, { claim, bought: u.giftsBought });
    }
    send(res, 400, { error: 'Unknown action' });
  } catch (e) { fail(res, e); }
}
