// Customer emails: order confirmation (thank you + order summary) and the Mundo XI unlock-code email.
// English by default, Hebrew when the buyer used the site in Hebrew.
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const money = v => '$' + (Math.round(+v * 100) / 100).toFixed(2);
const NAVY = '#0F1E33', GOLD = '#E8B730', GREEN = '#17804F', CHALK = '#F4F6F3', INK2 = '#4A5668';

const TXT = {
  en: {
    dir: 'ltr', align: 'left', ralign: 'right',
    thanksSubj: o => `Thank you for your order ${o}`,
    thanksTitle: n => n ? `Thank you, ${n}!` : 'Thank you for your order!',
    thanksIntro: 'We got your order and we are getting it ready. Here is your summary.',
    order: 'Order', date: 'Date', item: 'Item', qty: 'Qty', price: 'Price', free: 'FREE',
    subtotal: 'Subtotal', shipping: 'Shipping', total: 'Total paid', shipTo: 'Shipping to',
    nextH: 'What happens next',
    next1: 'We pack your order and email you the tracking number as soon as it ships.',
    next2: n => `Your Mundo XI player code${n > 1 ? 's arrive' : ' arrives'} in a separate email in a few minutes.`,
    view: 'View my order', help: 'Questions? Just reply to this email.',
    codesSubj: o => `Your Mundo XI players are unlocked (${o})`,
    codesTitle: 'Your players are ready to unlock',
    codesIntro: n => `Here ${n > 1 ? `are your ${n} special codes` : 'is your special code'} from order`,
    redeemBtn: 'Unlock now', how: 'How to unlock',
    how1: 'Tap “Unlock now” (or open Mundo XI → Redeem).', how2: 'Sign in with this email address.', how3: 'The code fills in. Tap Redeem and open your pack.',
    once: 'Each code works once and is linked to your account.',
    open: 'Open Mundo XI',
  },
  he: {
    dir: 'rtl', align: 'right', ralign: 'left',
    thanksSubj: o => `תודה על ההזמנה ${o}`,
    thanksTitle: n => n ? `תודה, ${n}!` : 'תודה על ההזמנה!',
    thanksIntro: 'קיבלנו את ההזמנה שלכם ואנחנו כבר מכינים אותה. הנה הסיכום.',
    order: 'הזמנה', date: 'תאריך', item: 'פריט', qty: 'כמות', price: 'מחיר', free: 'מתנה',
    subtotal: 'סכום ביניים', shipping: 'משלוח', total: 'סה"כ שולם', shipTo: 'כתובת למשלוח',
    nextH: 'מה קורה עכשיו',
    next1: 'אנחנו אורזים את ההזמנה ושולחים לכם מספר מעקב ברגע שהיא יוצאת.',
    next2: n => n > 1 ? 'קודי השחקנים של Mundo XI יגיעו במייל נפרד בעוד כמה דקות.' : 'קוד השחקנים של Mundo XI יגיע במייל נפרד בעוד כמה דקות.',
    view: 'צפייה בהזמנה', help: 'שאלות? פשוט השיבו למייל הזה.',
    codesSubj: o => `השחקנים שלכם ב-Mundo XI מחכים (${o})`,
    codesTitle: 'השחקנים שלכם מוכנים',
    codesIntro: n => n > 1 ? `הנה ${n} הקודים המיוחדים שלכם מהזמנה` : 'הנה הקוד המיוחד שלכם מהזמנה',
    redeemBtn: 'לפתיחה עכשיו', how: 'איך פותחים',
    how1: 'הקישו "לפתיחה עכשיו" (או Mundo XI ← מימוש קוד).', how2: 'התחברו עם כתובת המייל הזו.', how3: 'הקוד ממולא אוטומטית. הקישו "מימוש" ופתחו את החבילה.',
    once: 'כל קוד עובד פעם אחת ומקושר לחשבון שלכם.',
    open: 'פתיחת Mundo XI',
  },
};
const T = lang => TXT[lang === 'he' ? 'he' : 'en'];

function shell(t, title, inner) {
  return `<!doctype html><html dir="${t.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:${CHALK};font-family:Arial,Helvetica,sans-serif;color:${NAVY}">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${CHALK};padding:24px 0"><tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#fff;border-radius:16px;overflow:hidden" dir="${t.dir}">
<tr><td style="background:${NAVY};padding:22px 28px;text-align:${t.align}"><span style="color:${GOLD};font-weight:900;font-size:22px;letter-spacing:1px">★ FUTBOL MUNDO</span></td></tr>
<tr><td style="padding:30px 28px;text-align:${t.align}"><h1 style="margin:0 0 12px;font-size:26px;line-height:1.2">${esc(title)}</h1>${inner}</td></tr>
<tr><td style="padding:18px 28px;background:${CHALK};color:${INK2};font-size:12px;text-align:${t.align}">Futbol Mundo · futbolmundoshop.com · ${esc(t.help)}</td></tr>
</table></td></tr></table></body></html>`;
}
const button = (url, label) => `<p style="margin:24px 0 4px"><a href="${esc(url)}" style="background:${GREEN};color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;

// order = {order, created, items:[{name,q,amount}], subtotal, total, ship, codeCount}
export function orderEmail(o, { lang, name, origin }) {
  const t = T(lang), when = new Date(o.created || Date.now()).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const shipping = Math.max(0, Math.round(((o.total || 0) - (o.subtotal || 0)) * 100) / 100);
  const rows = (o.items || []).map(i => { const gift = /^FREE GIFT: /.test(i.name) || !i.amount;
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #E6E9E4;font-size:14px">${gift ? '🎁 ' : ''}${esc(String(i.name).replace(/^FREE GIFT: /, ''))}</td><td style="padding:10px 8px;border-bottom:1px solid #E6E9E4;font-size:14px;text-align:center;color:${INK2}">${i.q}</td><td style="padding:10px 0;border-bottom:1px solid #E6E9E4;font-size:14px;text-align:${t.ralign};white-space:nowrap;${gift ? `color:${GREEN};font-weight:bold` : ''}">${gift ? t.free : money(i.amount)}</td></tr>`; }).join('');
  const sh = o.ship, a = sh && (sh.address || {});
  const addr = sh ? [sh.name, a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.state, a.country].filter(Boolean).map(esc).concat(sh.phone ? [`<span dir="ltr">${esc(sh.phone)}</span>`] : []).join('<br>') : '';
  const sum = (k, v, b) => `<tr><td colspan="2" style="padding:5px 0;font-size:${b ? 16 : 14}px;${b ? 'font-weight:bold' : `color:${INK2}`}">${k}</td><td style="padding:5px 0;text-align:${t.ralign};font-size:${b ? 16 : 14}px;${b ? 'font-weight:bold' : ''}">${v}</td></tr>`;
  const inner = `<p style="margin:0 0 20px;font-size:15px;color:${INK2};line-height:1.5">${esc(t.thanksIntro)}</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CHALK};border-radius:12px;margin-bottom:18px"><tr>
    <td style="padding:14px 16px;font-size:13px;color:${INK2}">${t.order}<br><b style="font-size:17px;color:${NAVY}">${esc(o.order)}</b></td>
    <td style="padding:14px 16px;font-size:13px;color:${INK2};text-align:${t.ralign}">${t.date}<br><b style="font-size:15px;color:${NAVY}">${esc(when)}</b></td></tr></table>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><th style="text-align:${t.align};font-size:12px;color:${INK2};padding-bottom:6px;border-bottom:2px solid ${NAVY}">${t.item}</th><th style="font-size:12px;color:${INK2};padding:0 8px 6px;border-bottom:2px solid ${NAVY}">${t.qty}</th><th style="text-align:${t.ralign};font-size:12px;color:${INK2};padding-bottom:6px;border-bottom:2px solid ${NAVY}">${t.price}</th></tr>
    ${rows}
    <tr><td colspan="3" style="height:8px"></td></tr>
    ${sum(t.subtotal, money(o.subtotal || 0))}${sum(t.shipping, shipping ? money(shipping) : t.free)}${sum(t.total, money(o.total || 0), 1)}
  </table>
  ${addr ? `<p style="margin:22px 0 4px;font-size:13px;color:${INK2}"><b style="color:${NAVY}">${t.shipTo}</b><br>${addr}</p>` : ''}
  <h2 style="margin:26px 0 8px;font-size:17px">${t.nextH}</h2>
  <p style="margin:0 0 6px;font-size:14px;line-height:1.5">📦 ${esc(t.next1)}</p>
  ${o.codeCount ? `<p style="margin:0;font-size:14px;line-height:1.5">⚽ ${esc(t.next2(o.codeCount))}</p>` : ''}
  ${button(`${origin}/thank-you?order=${encodeURIComponent(o.order)}`, t.view)}`;
  return { subject: t.thanksSubj(o.order), html: shell(t, t.thanksTitle(name), inner) };
}

// codes = [{code,label}]
export function codesEmail(order, codes, { lang, origin }) {
  const t = T(lang);
  const label = c => { if (lang !== 'he') return c.label; const m = String(c.label).match(/^Shirt (\d+): ([\d,]+) .*?(\d+)-player pack/); return m ? `חולצה ${m[1]}: ${m[2]} Mundo Credits, חבילה של ${m[3]} שחקנים` : c.label; };
  const cards = codes.map(c => `<table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:14px;margin:12px 0"><tr><td style="padding:18px 18px 16px;text-align:center">
    <div style="font-size:12px;color:#AEB9C7;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">${esc(label(c))}</div>
    <div dir="ltr" style="font-family:'Courier New',monospace;font-size:21px;font-weight:bold;color:${GOLD};letter-spacing:1.5px">${esc(c.code)}</div>
    <a href="${esc(`${origin}/?redeem=${encodeURIComponent(c.code)}#game/redeem`)}" style="display:inline-block;margin-top:12px;background:${GOLD};color:${NAVY};text-decoration:none;padding:10px 20px;border-radius:999px;font-weight:bold;font-size:14px">${esc(t.redeemBtn)}</a>
  </td></tr></table>`).join('');
  const inner = `<p style="margin:0 0 6px;font-size:15px;color:${INK2};line-height:1.5">${esc(t.codesIntro(codes.length))} <b style="color:${NAVY}">${esc(order)}</b>.</p>
  ${cards}
  <h2 style="margin:22px 0 8px;font-size:16px">${t.how}</h2>
  <ol style="margin:0;padding-${t.align}:20px;font-size:14px;line-height:1.7">
    <li>${esc(t.how1)}</li><li>${esc(t.how2)}</li><li>${esc(t.how3)}</li></ol>
  <p style="margin:14px 0 0;font-size:12px;color:${INK2}">${esc(t.once)}</p>
  ${button(`${origin}/#game/redeem`, t.open)}`;
  return { subject: t.codesSubj(order), html: shell(t, t.codesTitle, inner) };
}
