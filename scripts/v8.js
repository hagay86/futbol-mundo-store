// =====================================================================
// FUTBOL MUNDO v8 — PayPal checkout (PayPal or guest card), shipping picked
// on the bag page, PayPal return flow, owner order tools.
// =====================================================================
var coShipMethod = 'standard';
const SHIP_OPTS = [['standard', 9.99, 'Standard delivery', '5–7 business days'], ['express', 14.99, 'Express delivery', '2–3 business days'], ['overnight', 29.99, 'Next-day delivery', '1 business day']];
function shipCost(method){ const m = merchTotal(cart); if (!m) return 0; const o = SHIP_OPTS.find(x => x[0] === method) || SHIP_OPTS[0]; return method === 'standard' && m >= FREE_SHIP_OVER ? 0 : o[1]; }
function pickShip(m){ coShipMethod = m; renderCheckout(); }
const _renderCheckout8 = renderCheckout;
renderCheckout = function(){
  _renderCheckout8();
  let wrap = $('#co-ship-wrap');
  if (!wrap) { $('#co-cart-items').insertAdjacentHTML('afterend', '<div id="co-ship-wrap"></div>'); wrap = $('#co-ship-wrap'); }
  const m = merchTotal(cart), subtotal = cart.reduce((s, c) => s + c.p * c.q, 0);
  if (!m) { wrap.innerHTML = ''; } else {
    wrap.innerHTML = `<h2 class="co-h2">Shipping method</h2>` + SHIP_OPTS.map(([k, , name, eta]) => { const cost = shipCost(k);
      return `<label class="co-ship-opt"><input type="radio" name="shipm" value="${k}" ${coShipMethod === k ? 'checked' : ''} onchange="pickShip('${k}')"><div class="co-ship-info"><b>${name}</b></div><div class="co-ship-price">${cost ? money(cost) : '<span class="free">FREE</span>'}</div></label>`; }).join('');
  }
  const ship = shipCost(coShipMethod);
  $('#co-sum-ship').innerHTML = !m ? 'None (digital)' : ship ? money(ship) : '<span style="color:#34c759;font-weight:600">FREE</span>';
  $('#co-sum-total').textContent = money(subtotal + ship);
};

// PayPal return: /?pp=1&token=<order id>&PayerID=...
(function(){
  const q = new URLSearchParams(location.search);
  if (q.get('pp') && q.get('token')) setTimeout(() => handleOrderReturn('pp:' + q.get('token')), 50);
})();

// ---------------- Owner tools ----------------
const _openAccount8 = openAccount;
openAccount = async function(){
  await _openAccount8();
  if (!ME.user) return;
  try { const r = await fetch('/api/admin'); if (r.ok) $('.acc-actions')?.insertAdjacentHTML('afterbegin', '<button class="info-btn" style="background:#E8B730;color:#0F1E33" onclick="openAdmin()">Store orders (owner)</button>'); } catch (e) {}
};
async function openAdmin(){
  $('#info-card').classList.add('wide');
  $('#info-modal-body').innerHTML = '<h3>Store orders</h3><p>Loading…</p>';
  $('#info-modal').classList.add('open');
  let j; try { j = await api('/api/admin'); } catch (e) { $('#info-modal-body').innerHTML = `<h3>Store orders</h3><p>${escapeHtml(e.message)}</p>`; return; }
  const st = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
  $('#info-modal-body').innerHTML = `<h3>Store orders</h3><p>Change a status or add a tracking number. The customer gets an email.</p><div class="adm-list">${j.orders.map(o => `
    <div class="adm-o"><div class="adm-top"><b>${o.order}</b><span>${new Date(o.created).toLocaleString()} · ${money(o.total)} · ${escapeHtml(o.email)} · ${o.provider || ''}</span></div>
    <div class="adm-items">${o.items.map(i => `${escapeHtml(i.name)} × ${i.q}`).join('<br>')}${o.scarf ? '<br><b>+ FREE club scarf</b>' : ''}</div>
    ${o.ship ? `<div class="adm-ship">${[o.ship.name, o.ship.phone && '☎ ' + o.ship.phone, o.ship.address?.line1, o.ship.address?.line2, [o.ship.address?.postal_code, o.ship.address?.city].filter(Boolean).join(' '), o.ship.address?.state, o.ship.address?.country].filter(Boolean).map(escapeHtml).join(', ')}</div>` : ''}
    <div class="adm-row"><select id="st-${o.order}">${st.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select><input class="info-input" id="tr-${o.order}" placeholder="Tracking number" value="${escapeAttr(o.tracking)}"><button class="btn btn-pri btn-sm" onclick="saveAdmin('${o.order}')">Save</button></div></div>`).join('') || '<p>No orders yet.</p>'}</div>`;
}
async function saveAdmin(order){
  try { await api('/api/admin', {method:'POST', body:{order, status:$('#st-' + order).value, tracking:$('#tr-' + order).value}}); showToast(`${order} updated. Customer emailed`); }
  catch (e) { showToast(e.message); }
}
