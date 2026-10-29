// =====================================================================
// FUTBOL MUNDO v9 — card form right on the bag page (PayPal JS SDK).
// The black "Debit or Credit Card" button opens card fields on our page:
// no PayPal login. The redirect buttons stay as a fallback if the SDK fails.
// =====================================================================
const PP_CLIENT_ID = 'BAAcpWVZSv030wUMQde4l21vlth1TeSvuvPbdXFnGPizDEtGHgsZb30mS_RtaHxOGO5wgkDejjGFoXoiuk';
const PP_LOCALE = { en:'en_US', es:'es_ES', pt:'pt_BR', fr:'fr_FR', de:'de_DE', it:'it_IT', he:'he_IL', ar:'ar_EG' };
let ppSdk = null, ppRendered = false;
function coItems(){
  return cart.map(c => c.pack ? {kind:'points', pts:c.pack, q:c.q}
    : c.box ? {kind:'box', box:c.box, sz:c.sz, league:c.league, q:c.q}
    : {kind:'product', pid:c.pid ?? (PRODUCTS.find(p => p.n === c.n) || {}).id, n:c.n, sz:c.sz, cname:c.cname, cnum:c.cnum, q:c.q});
}
function loadPaypalSdk(){
  if (ppSdk) return ppSdk;
  const loc = PP_LOCALE[(window.I18N && I18N.lang) || 'en'] || 'en_US';
  ppSdk = new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${PP_CLIENT_ID}&currency=USD&intent=capture&components=buttons&enable-funding=card&disable-funding=paylater,credit,venmo&locale=${loc}`;
    s.setAttribute('data-namespace', 'paypalSdk');
    s.onload = () => window.paypalSdk ? ok(window.paypalSdk) : bad(new Error('no sdk'));
    s.onerror = () => bad(new Error('sdk blocked'));
    document.head.appendChild(s);
  });
  ppSdk.catch(() => { ppSdk = null; });
  return ppSdk;
}
async function renderPaypalButtons(){
  const box = $('#pp-buttons'); if (!box || ppRendered) return;
  let pp; try { pp = await loadPaypalSdk(); } catch (e) { return; }  // fallback buttons stay visible
  const common = {
    onClick: (data, actions) => {
      if (!cart.length) { showToast('Your bag is empty'); return actions.reject(); }
      if (ME.ready && !ME.user) {
        closeCheckout();
        openAuth('signup', 'Create your free account to check out. We send your Mundo XI codes and order updates to it.', () => openCheckout());
        return actions.reject();
      }
      return actions.resolve();
    },
    createOrder: async () => {
      const r = await fetch('/api/checkout', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({items:coItems(), ship:coShipMethod, lang:I18N.lang, pay:'card', sdk:1})});
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.id) { showToast(j.error || 'Checkout is unavailable right now'); throw new Error(j.error || 'checkout'); }
      return j.id;
    },
    onApprove: data => handleOrderReturn('pp:' + data.orderID),
    onError: () => showToast('The payment did not go through. Please check the card details and try again'),
  };
  const btns = [
    pp.Buttons(Object.assign({ fundingSource: pp.FUNDING.CARD, style: { shape:'pill', color:'black', label:'pay', height:48 } }, common)),
    pp.Buttons(Object.assign({ fundingSource: pp.FUNDING.PAYPAL, style: { shape:'pill', color:'gold', label:'paypal', height:48 } }, common)),
  ].filter(b => b.isEligible());
  if (!btns.length) return;
  box.innerHTML = '';
  for (const b of btns) { const d = document.createElement('div'); d.className = 'pp-btn'; box.appendChild(d); await b.render(d); }
  ppRendered = true;
  $('.co-pay-btns')?.classList.add('hidden-fallback');
  const note = $('.co-stripe-note'); if (note) { const t = 'Pay by card right here, no account needed. Secured by PayPal.'; note.textContent = (window.I18N && I18N.dict && I18N.dict[t]) || t; }
}
const _openCheckout9 = openCheckout;
openCheckout = function(){ const r = _openCheckout9.apply(this, arguments); setTimeout(renderPaypalButtons, 50); return r; };
