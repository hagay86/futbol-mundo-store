// Store owner tools. Only the account whose email equals ADMIN_EMAIL can use them.
// GET  /api/admin            → latest orders (newest first)
// POST /api/admin {order, status, tracking} → update an order's status / tracking number (emails the customer)
import { send, readJson, fail } from './_lib.js';
import { currentUser, redis, getJSON, setJSON, sendEmail, emailLayout, siteUrl } from './_db.js';

export default async function handler(req, res) {
  try {
    const u = await currentUser(req);
    if (!u || !process.env.ADMIN_EMAIL || u.email !== process.env.ADMIN_EMAIL.trim().toLowerCase()) return send(res, 403, { error: 'Owner only' });
    if (req.method === 'GET') {
      const ids = await redis('LRANGE', 'allorders', 0, 99) || [];
      const orders = [];
      for (const id of ids) { const o = await getJSON('order:' + id); if (o) orders.push({ order: o.order, email: o.email, total: o.total, created: o.created, status: o.status, tracking: o.tracking || '', items: o.items, ship: o.ship, scarf: o.scarf, provider: o.provider }); }
      return send(res, 200, { orders });
    }
    const { order, status, tracking } = await readJson(req);
    const id = await redis('GET', 'ordernum:' + String(order || '').toUpperCase());
    const o = id && await getJSON('order:' + id);
    if (!o) return send(res, 404, { error: 'Order not found' });
    if (status) o.status = String(status).slice(0, 40);
    if (tracking !== undefined) o.tracking = String(tracking).slice(0, 200);
    await setJSON('order:' + id, o);
    if (o.email) await sendEmail({ to: o.email, subject: `Order ${o.order}: ${o.status}`, html: emailLayout(`Your order is ${o.status.toLowerCase()}`, `<p>Order <b>${o.order}</b> is now: <b>${o.status}</b>.</p>${o.tracking ? `<p>Tracking: <b>${o.tracking}</b></p>` : ''}`, { url: siteUrl(req) + '/#account', label: 'View my order' }) });
    send(res, 200, { ok: true });
  } catch (e) { fail(res, e); }
}
