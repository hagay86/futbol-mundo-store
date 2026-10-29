// GET /api/status → which services are switched on (never reveals keys).
import { stripeKey, send } from './_lib.js';
import { dbReady, emailReady } from './_db.js';
import { paypalReady, paypalMode, paypalCheck } from './_paypal.js';

export default async function handler(req, res) {
  const k = stripeKey();
  let stripe = !k ? 'not connected' : k.startsWith('sk_live_') || k.startsWith('rk_live_') ? 'live' : 'test';
  let stripeOk = false, account = '';
  if (k) {
    try {
      const r = await fetch('https://api.stripe.com/v1/account', { headers: { Authorization: 'Bearer ' + k } });
      const j = await r.json(); stripeOk = r.ok;
      if (r.ok) account = j.settings?.dashboard?.display_name || j.business_profile?.name || '';
      if (r.ok && stripe === 'live' && j.charges_enabled === false) stripe = 'live (payments not activated yet)';
    } catch (e) {}
  }
  send(res, 200, { checkout: paypalReady() ? 'paypal' : k ? 'stripe' : 'none', paypal: paypalReady() ? paypalMode() : 'secret missing', paypalKeyWorks: paypalReady() ? await paypalCheck() : false, stripe, stripeKeyWorks: stripeOk, stripeAccountName: account, database: dbReady(), email: emailReady() });
}
