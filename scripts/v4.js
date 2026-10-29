// =====================================================================
// FUTBOL MUNDO v4 — real Stripe checkout, signed Mundo XI codes,
// demo mode (gray DEMO players, play locked until 11 real players),
// 6-player pack per shirt, free scarf + bonus player over $30, gifts over $30.
// =====================================================================
const SHIRT_POINTS = 4000;           // = one 6-player Gold pack
const SCARF_MIN = 30;                // USD of merchandise for the free scarf / gifts unlock
const SUPPORT_EMAIL = 'support@futbolmundoshop.com';
G.orders = G.orders || []; G.spent = G.spent || 0;

// ---------------- Helpers ----------------
const isDemo = c => !!(c && c.demo);
const realCards = () => G.cards.filter(c => !c.demo);
const realInXI = () => teamScore().xi.filter(c => !c.demo).length;
const canPlay = () => squadFull() && realInXI() === 11;
const merchTotal = items => items.filter(c => !c.pack).reduce((s, c) => s + c.p * c.q, 0);
const shirtCount = items => items.reduce((s, c) => s + (c.box ? c.box * c.q : c.pack ? 0 : (PRODUCTS[c.pid ?? -1] || PRODUCTS.find(p => p.n === c.n) || {}).shirt ? c.q : 0), 0);
function decodeCode(code){
  const m = /^MX-([PS])([0-9A-Z]{3})-[A-Z2-9]{4}-[A-Z2-9]{8}$/.exec(code);
  return m ? {type:m[1] === 'P' ? 'points' : 'scarf', amount:parseInt(m[2], 36) * 100} : null;
}

// ---------------- Cards: demo look ----------------
function cardHTML(c){
  const r = rarityOf(c);
  return `<div class="pcx r-${r.k}${c.demo ? ' demo' : ''}" title="${escapeAttr(c.player)} · ${c.demo ? 'Demo player' : r.label}">
    ${c.demo ? '<div class="demo-tag">DEMO</div>' : ''}
    <div class="top"><div class="rt">${c.rating}</div><div class="ps">${c.pos}</div></div>
    <div class="no">#${c.num}</div>
    <div class="shirt"><img src="${c.img}" alt="" loading="lazy"></div>
    <div class="nm">${escapeHtml(c.player)}</div><div class="tm">${escapeHtml(c.team)}</div>
    <div class="rar">${c.demo ? 'Demo' : r.label}</div></div>`;
}
function seedDemo(){
  if (G.demoSeeded) return;
  G.demoSeeded = true;
  const plan = ['GK','GK','DEF','DEF','DEF','DEF','DEF','DEF','DEF','DEF','MID','MID','MID','MID','MID','MID','FWD','FWD','FWD','FWD','FWD','FWD'];
  plan.forEach(pos => { const c = randomCard({lo:64, hi:86, skew:1.2, pos}); c.demo = true; G.cards.push(c); });
  autoPick(true); save();
}
function autoPick(silent){
  if (!G.cards.length) { gTab('packs'); return; }
  G.squad = {}; const used = new Set();
  const sorted = G.cards.slice().sort((a, b) => (a.demo - b.demo) || b.rating - a.rating);
  const keys = slotKeys();
  keys.forEach(s => { const c = sorted.find(c => !used.has(c.id) && c.pos === s.pos); if (c) { G.squad[s.key] = c.id; used.add(c.id); } });
  keys.forEach(s => { if (G.squad[s.key]) return; const c = sorted.find(c => !used.has(c.id)); if (c) { G.squad[s.key] = c.id; used.add(c.id); } });
  save(); if (!silent) { renderSquad(); showToast(realCards().length ? 'Best eleven picked, real players first' : 'Demo eleven picked'); }
}

// ---------------- The play gate ----------------
function showPlayGate(){
  const real = realCards().length, inXI = realInXI(), pct = Math.min(100, real / 11 * 100);
  const needShirts = Math.max(0, Math.ceil((11 - real) / 6));
  const body = real >= 11
    ? `You have ${real} real players but only ${inXI} of them are in your eleven. Swap the gray demo players out and you're ready.<div class="gate-btns"><button class="btn btn-pitch" onclick="closeInfo();autoPick();gTab('squad')">Use my real players</button></div>`
    : `Your demo squad is just a preview. To play matches and enter cups, every place in your eleven needs a <b>real</b> player.
      <div class="gate-meter"><div class="gate-bar"><i style="width:${pct}%"></i></div><b>${real}/11 real players</b></div>
      <ul class="gate-list"><li><b>Every shirt</b> comes with ${SHIRT_POINTS.toLocaleString()} points: one 6-player Gold pack.</li><li><b>Orders over $${SCARF_MIN}</b> add a free club scarf and a bonus player.</li><li>Scarf + 1 shirt = 7 players. One more shirt and you can play.</li></ul>
      <p style="margin:0">${needShirts ? `About <b>${needShirts} more shirt${needShirts > 1 ? 's' : ''}</b> gets you on the pitch.` : ''}</p>
      <div class="gate-btns"><button class="btn btn-pitch" onclick="closeInfo();go('shop')">Shop jerseys</button>${G.points >= PACK_TYPES.gold.price ? `<button class="btn btn-gold" onclick="closeInfo();gTab('packs')">Open a 6-player pack</button>` : ''}<button class="btn btn-ghost" onclick="closeInfo();go('game','redeem')">I have a code</button></div>`;
  $('#info-modal-body').innerHTML = `<h3>You need 11 real players to play</h3><div class="gate">${body}</div>`;
  $('#info-modal').classList.add('open');
}
const _openMatch = openMatch;
openMatch = function(o){ if (!canPlay()) { closeMatch(); return showPlayGate(); } return _openMatch(o); };
const _enterCup = enterCup;
enterCup = function(id, free){ if (!canPlay()) return showPlayGate(); return _enterCup(id, free); };
function demoBanner(){
  const el = $('#demo-banner'); if (!el) return;
  if (canPlay()) { el.innerHTML = ''; el.classList.add('hidden'); return; }
  const real = realCards().length;
  el.classList.remove('hidden');
  el.innerHTML = `<div class="wrap demo-in"><span class="demo-pill">DEMO</span><span><b>You're managing a demo squad.</b> Gray cards are demo players. Real players: <b>${real}/11</b>. Every shirt brings a 6-player pack.</span><button class="btn btn-gold btn-sm" onclick="go('shop')">Shop jerseys</button><button class="btn btn-ghost btn-sm" onclick="showPlayGate()">How it works</button></div>`;
}
const _updateStats = updateStats;
updateStats = function(){ _updateStats(); demoBanner(); };

// ---------------- Card picker: demo cards can't be sold, listed or traded ----------------
function pickCard(mode, slotKey, pos, listingIdx){
  pickCtx = {mode, slotKey, pos, listingIdx};
  const pool = mode === 'slot' ? G.cards : realCards();
  if (!pool.length) { openInfo(mode === 'slot' ? 'No players yet' : 'No real players yet', mode === 'slot' ? 'Redeem a code to get players.' : 'Demo players can\'t be sold, listed or traded. Every shirt you buy comes with a 6-player pack of real players.'); return; }
  const inSquad = new Set(Object.values(G.squad));
  const cards = pool.slice().sort((a, b) => (pos ? (b.pos === pos) - (a.pos === pos) : 0) || (a.demo - b.demo) || b.rating - a.rating);
  const titles = {slot:`Choose a ${pos === 'GK' ? 'goalkeeper' : pos === 'DEF' ? 'defender' : pos === 'MID' ? 'midfielder' : 'forward'}`, trade:'Choose a card to offer', cash:'Choose a player to sell', list:'Choose a card to list'};
  $('#info-card').classList.add('wide');
  $('#info-modal-body').innerHTML = `<h3>${titles[mode]}</h3>
    <p>${mode === 'slot' ? 'Real players are shown before demo players.' : mode === 'cash' ? 'Sale prices: ' + RARITY.map(r => r.label + ' ' + r.pts.toLocaleString()).join(', ') + '. Demo players can\'t be sold.' : mode === 'trade' ? 'They\'ll accept a card within 2 rating points of theirs, or better.' : 'Other fans can send offers for listed cards.'}</p>
    ${slotKey && G.squad[slotKey] ? '<button class="btn btn-ghost btn-sm" style="margin-bottom:16px" onclick="clearSlot()">Empty this slot</button>' : ''}
    <div class="col-grid">${cards.map(c => `<div class="col-item"><div onclick="choose('${c.id}')" role="button" tabindex="0">${cardHTML(c)}</div>${inSquad.has(c.id) ? '<span class="muted" style="font-size:12px;text-align:center">In your eleven</span>' : ''}</div>`).join('')}</div>`;
  $('#info-modal').classList.add('open');
}
const _choose = choose;
choose = function(id){ const c = cardById(id); if (isDemo(c) && pickCtx.mode !== 'slot') { showToast('Demo players can\'t leave your club'); return; } return _choose(id); };
function renderCollection(){
  const el = $('#collection');
  const sorted = G.cards.slice().sort((a, b) => (a.demo - b.demo) || b.rating - a.rating);
  const inXI = new Set(Object.values(G.squad));
  el.innerHTML = `<div class="sec-head" style="margin-bottom:18px"><div><h3 class="h3" style="margin:0">Your club · ${realCards().length} real players</h3><p style="margin-top:6px">Plus ${G.cards.length - realCards().length} demo players (gray) to try squad building.</p></div><button class="btn btn-pri btn-sm" onclick="autoPick();gTab('squad')">Pick my best eleven</button></div>
    <div class="col-grid">${sorted.map(c => `<div class="col-item">${cardHTML(c)}<div class="acts">${c.demo ? '<button disabled style="opacity:.6">Demo player</button>' : inXI.has(c.id) ? '<button disabled style="opacity:.6">In your eleven</button>' : `<button onclick="pickCtx={mode:'cash'};choose('${c.id}')">Sell for ${rarityOf(c).pts.toLocaleString()}</button>`}</div></div>`).join('')}</div>`;
}

// ---------------- Gifts: unlocked after $30 spent ----------------
function renderRewards(){
  const open = G.spent >= SCARF_MIN;
  $('#rewards').innerHTML = (open ? '' : `<div class="gift-lock"><b>Gifts unlock after you spend $${SCARF_MIN} in the shop.</b><span>You've spent $${G.spent.toFixed(2)} so far. Any order over $${SCARF_MIN} also comes with a free club scarf.</span><button class="btn btn-pitch btn-sm" onclick="go('shop')">Shop jerseys</button></div>`) +
    GIFTS.map((g, i) => `<div class="reward${open ? '' : ' locked'}"><div class="rp">${g.pts.toLocaleString()}</div><b>${g.name}</b><span>${g.txt}</span>
    <button class="btn ${open && G.points >= g.pts ? 'btn-pri' : 'btn-ghost'} btn-sm" onclick="claimGift(${i})">${!open ? `Unlocks at $${SCARF_MIN} spent` : G.points >= g.pts ? 'Claim gift' : `${(g.pts - G.points).toLocaleString()} points to go`}</button></div>`).join('') +
    (G.gifts.length ? `<div class="reward" style="background:var(--turf)"><b>Claimed</b><span>${G.gifts.map(escapeHtml).join('<br>')}</span></div>` : '');
  $('#point-table').innerHTML = RARITY.map(r => `<div><span>${r.label}</span><b>${r.pts.toLocaleString()} pts</b></div>`).join('');
  $('#packs-gifts').innerHTML = pointPacksHTML();
}
function claimGift(i){
  const g = GIFTS[i];
  if (G.spent < SCARF_MIN) { openInfo('Gifts are locked', `Gifts unlock once you've spent $${SCARF_MIN} in the shop. You've spent $${G.spent.toFixed(2)} so far.`); return; }
  if (G.points < g.pts) { showToast(`You need ${(g.pts - G.points).toLocaleString()} more points`); return; }
  const claim = 'GF-' + Date.now().toString(36).toUpperCase().slice(-6);
  const order = G.orders[0] ? G.orders[0].order : '';
  G.points -= g.pts; G.gifts.push(`${g.name} · ${claim}`); save(); renderRewards();
  const subject = encodeURIComponent(`Gift claim ${claim}: ${g.name}`);
  const mbody = encodeURIComponent(`Hi Futbol Mundo,\n\nI'd like to claim: ${g.name}\nClaim ID: ${claim}\nOrder number: ${order}\n\nShipping address:\n`);
  openInfo('Gift claimed', `Your claim ID is <b>${claim}</b>. Send it to <a class="info-link" href="mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${mbody}">${SUPPORT_EMAIL}</a> with your order number${order ? ` (<b>${order}</b>)` : ''} and we'll ship your ${escapeHtml(g.name.toLowerCase())}.`);
}

// ---------------- Redeem (codes are checked by the server) ----------------
function applyCode(code, info, quiet){
  G.used.push(code);
  if (info.type === 'points') {
    G.points += info.amount; save();
    const packs = Math.floor(G.points / PACK_TYPES.gold.price);
    $('#redeem-result').innerHTML = `<div class="redeem-points"><b>+${info.amount.toLocaleString()}</b><span>points added</span>${packs ? `<button class="btn btn-gold" onclick="buyPackPts('gold')">Open a 6-player Gold pack</button>` : ''}</div>`;
    return `+${info.amount.toLocaleString()} points`;
  }
  const card = randomCard({lo:66, hi:84, skew:1.4});
  G.cards.push(card); save();
  const show = () => { $('#redeem-result').innerHTML = cardHTML(card); };
  isWalkout(card) && !quiet ? walkout(card, show) : show();
  return `${card.player} joined your club`;
}
async function redeemCode(){
  const inp = $('#code-in'); const code = inp.value.trim().toUpperCase().replace(/\s/g, '');
  if (!/^MX-[PS][0-9A-Z]{3}-[A-Z2-9]{4}-[A-Z2-9]{8}$/.test(code)) { showToast('Codes look like MX-P014-AB2C-DE3F4G5H'); inp.focus(); return; }
  if (G.used.includes(code)) { showToast('That code has already been redeemed'); return; }
  const btn = inp.nextElementSibling; btn.disabled = true;
  try {
    const r = await fetch('/api/redeem', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code})});
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'That code did not work');
    inp.value = ''; showToast(applyCode(code, j)); renderGame();
  } catch (e) { showToast(e.message); }
  btn.disabled = false;
}

// ---------------- Game entry ----------------
function renderGame(){
  seedDemo(); career(); updateStats(); gTab(gCurrent);
}
const _renderPacks = renderPacks;
renderPacks = function(){ _renderPacks(); const p = $('#packs-main > p.muted:last-child'); if (p) p.innerHTML = `Every shirt you buy comes with ${SHIRT_POINTS.toLocaleString()} points: exactly one 6-player Gold pack. Orders over $${SCARF_MIN} add a free club scarf and a bonus player.`; };

// ---------------- Product pages & cart ----------------
function pdpItem(){
  const sz = getSelSize();
  if (!sz) { showToast('Please select a size'); return null; }
  const o = document.getElementById('pdp-overlay');
  return {n:o.dataset.name, p:parseFloat(o.dataset.price), img:o.dataset.img, sz, pid:pdpProduct ? pdpProduct.id : undefined,
    cname:document.getElementById('pdp-cname').value.trim(), cnum:document.getElementById('pdp-cnum').value.trim(), q:pdpQty};
}
function pdpAddToCart(){ const it = pdpItem(); if (!it) return; addToCart(it); closePDP(); showToast('Added to your bag'); setTimeout(toggleCart, 300); }
function pdpBuyNow(){ const it = pdpItem(); if (!it) return; addToCart(it); closePDP(); openCheckout(); }
function scarfNote(items){
  const m = merchTotal(items);
  if (!m) return '';
  return m >= SCARF_MIN ? `<div class="scarf-ok">🧣 Free club scarf + bonus Mundo XI player included</div>` : `<div class="scarf-todo">Add <b>${money(SCARF_MIN - m)}</b> more for a free club scarf + bonus player</div>`;
}
const _renderCart2 = renderCart;
renderCart = function(){
  _renderCart2();
  const s = shirtCount(cart), el = $('#cart-xi');
  if (el) el.innerHTML = (s ? `This order unlocks <b>${s} six-player pack${s > 1 ? 's' : ''}</b> (${s * 6} Mundo XI players)` : '') + scarfNote(cart);
};

// ---------------- Checkout (Stripe) ----------------
function setCoStep(n){
  coStep = n;
  $$('#co-overlay .co-step').forEach(s => s.classList.toggle('active', +s.dataset.step === n));
  $$('#co-overlay .co-step-dot').forEach(d => { const s = +d.dataset.step; d.classList.toggle('active', s === n); d.classList.toggle('done', s < n); });
}
function openCheckout(){
  if (!cart.length) { showToast('Your bag is empty'); return; }
  setCoStep(1); renderCheckout();
  $('#co-overlay').classList.add('open'); document.body.style.overflow = 'hidden';
}
function renderCheckout(){
  const subtotal = cart.reduce((s, c) => s + c.p * c.q, 0), m = merchTotal(cart);
  $('#co-cart-items').innerHTML = cart.length ? cart.map((c, i) => `
      <div class="co-line">
        <img src="${c.img}" alt="${escapeAttr(c.n)}" onerror="this.style.background='#f5f5f7'">
        <div class="co-line-info">
          <div class="co-line-name">${escapeHtml(c.n)}</div>
          <div class="co-line-meta">${c.pack ? 'Digital points' : 'Size ' + escapeHtml(c.sz)}${c.cname ? ' · ' + escapeHtml(c.cname) + ' #' + escapeHtml(c.cnum || '') : ''}</div>
          <div class="co-line-qty"><button onclick="coChgQty(${i},-1)" aria-label="Decrease">−</button><span class="qv">${c.q}</span><button onclick="coChgQty(${i},1)" aria-label="Increase">+</button><button class="rm" onclick="coRemove(${i})">Remove</button></div>
        </div>
        <div class="co-line-price">${money(c.p * c.q)}</div>
      </div>`).join('') + scarfNote(cart) : '<p class="co-empty">Your bag is empty.</p>';
  $('#co-sum-items').innerHTML = cart.map(c => `
    <div class="co-sum-item"><img src="${c.img}" alt=""><div class="co-sum-item-info"><div class="co-sum-item-name">${escapeHtml(c.n)}</div><div class="co-sum-item-meta">${c.pack ? 'Digital' : 'Size ' + escapeHtml(c.sz)} · Qty ${c.q}</div></div><div class="co-sum-item-price">${money(c.p * c.q)}</div></div>`).join('') +
    (m >= SCARF_MIN ? `<div class="co-sum-item"><div class="co-scarf-ico">🧣</div><div class="co-sum-item-info"><div class="co-sum-item-name">Club scarf + bonus player</div><div class="co-sum-item-meta">Free gift</div></div><div class="co-sum-item-price">$0.00</div></div>` : '');
  $('#co-sum-sub').textContent = money(subtotal);
  $('#co-sum-ship').innerHTML = !m ? 'None (digital)' : m >= FREE_SHIP_OVER ? '<span style="color:#34c759;font-weight:600">FREE standard</span>' : 'From $9.99, chosen next';
  $('#co-sum-total').textContent = money(subtotal);
}
function coChgQty(i, d){ cart[i].q = Math.max(1, Math.min(20, cart[i].q + d)); renderCart(); renderCheckout(); }
function coRemove(i){ cart.splice(i, 1); renderCart(); if (!cart.length) { closeCheckout(); showToast('Bag emptied'); return; } renderCheckout(); }
async function startStripeCheckout(){
  if (!cart.length) { showToast('Your bag is empty'); return; }
  const btn = $('#co-go'), orig = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="co-spinner"></span> Opening secure checkout…';
  const items = cart.map(c => c.pack ? {kind:'points', pts:c.pack, q:c.q}
    : c.box ? {kind:'box', box:c.box, sz:c.sz, league:c.league, q:c.q}
    : {kind:'product', pid:c.pid ?? (PRODUCTS.find(p => p.n === c.n) || {}).id, n:c.n, sz:c.sz, cname:c.cname, cnum:c.cnum, q:c.q});
  try {
    const r = await fetch('/api/checkout', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({items})});
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) throw new Error(r.status === 503 ? 'Checkout opens very soon. Please try again later.' : (j.error || 'Checkout is unavailable right now'));
    location.href = j.url;
  } catch (e) { showToast(e.message); btn.disabled = false; btn.innerHTML = orig; }
}
async function handleOrderReturn(id){
  history.replaceState(null, '', location.pathname + '#home');
  setCoStep(4);
  $('#co-overlay').classList.add('open'); document.body.style.overflow = 'hidden';
  $('#conf-num').textContent = '…'; $('#conf-email').textContent = 'your email';
  $('#conf-summary').innerHTML = '<p class="co-sub" style="text-align:center">Confirming your payment…</p>'; $('#conf-codes').innerHTML = '';
  let j = null;
  for (let t = 0; t < 6; t++) {
    try { const r = await fetch('/api/order?id=' + encodeURIComponent(id)); j = await r.json(); if (r.ok && j.paid) break; } catch (e) {}
    await new Promise(res => setTimeout(res, 1500));
  }
  if (!j || !j.paid) { $('#conf-summary').innerHTML = `<p class="co-sub" style="text-align:center">We couldn't confirm this payment yet. If you were charged, email ${SUPPORT_EMAIL} and we'll sort it out.</p>`; return; }
  const fresh = !G.orders.some(o => o.id === id);
  const added = [];
  if (fresh) {
    G.orders.unshift({id, order:j.order, total:j.total, at:Date.now(), email:j.email});
    G.spent += j.spent;
    j.codes.forEach(c => { if (!G.used.includes(c.code)) { const info = decodeCode(c.code); if (info) added.push(applyCode(c.code, info, true)); } });
    save(); cart = []; renderCart();
  }
  $('#conf-num').textContent = j.order;
  $('#conf-email').textContent = j.email || 'your email';
  $('#conf-summary').innerHTML = j.items.map(it => `<div class="cs-item"><div></div><div class="cs-item-info"><div>${escapeHtml(it.name)}</div><div class="meta">Qty ${it.q}</div></div><div>${money(it.amount)}</div></div>`).join('') +
    `<div class="cs-item" style="border-top:1px solid #d2d2d7;padding-top:12px;margin-top:8px;font-weight:600"><div></div><div class="cs-item-info">Total paid</div><div>${money(j.total)}</div></div>` +
    (j.scarf ? `<div class="scarf-ok" style="margin-top:12px">🧣 A free club scarf ships with this order</div>` : '');
  const pts = j.codes.reduce((s, c) => s + ((decodeCode(c.code) || {}).type === 'points' ? decodeCode(c.code).amount : 0), 0);
  $('#conf-codes').innerHTML = j.codes.length ? `<div class="co-codes"><h3>Added to your Mundo XI</h3>
    <p>${pts ? `<b>${pts.toLocaleString()} points</b>, enough for ${Math.floor(pts / PACK_TYPES.gold.price)} six-player pack${Math.floor(pts / PACK_TYPES.gold.price) === 1 ? '' : 's'}` : ''}${j.scarf ? `${pts ? ', plus ' : ''}<b>a bonus player</b> from your free scarf` : ''}. ${fresh ? 'They are already in your game on this device.' : 'These were added when you first opened this page.'} Keep the codes to use them on another device instead.</p>
    ${j.codes.map(o => `<div class="co-code"><b>${o.code}</b><span>${escapeHtml(o.label)}</span></div>`).join('')}
    <button class="co-btn-primary" style="margin-top:10px" onclick="closeCheckout();go('game','packs')">Open my packs in Mundo XI</button></div>` : '';
}

// ---------------- Account, orders, tracking, wishlist ----------------
function openAccount(){
  const rows = G.orders.map(o => `<div class="acc-order"><div><b>${o.order}</b><span>${new Date(o.at).toLocaleDateString()} · ${money(o.total)}</span></div><button class="btn btn-ghost btn-sm" onclick="trackOrder('${o.order}','${escapeAttr(o.email || '')}')">Track</button></div>`).join('');
  $('#info-modal-body').innerHTML = `<h3>Your orders</h3>
    ${rows ? `<div class="acc-orders">${rows}</div>` : '<p>Orders you place on this device show up here. Your receipt and order number are also emailed to you by Stripe.</p>'}
    <div class="score-rows" style="text-align:left;margin:14px 0"><div><span>Spent in the shop</span><b>${money(G.spent)}</b></div><div><span>Real Mundo XI players</span><b>${realCards().length}</b></div><div><span>Points</span><b>${G.points.toLocaleString()}</b></div></div>
    <button class="info-btn" onclick="openTrack()">Track another order</button>
    <p style="text-align:center;margin-top:14px;margin-bottom:0;font-size:12px">Questions? <a class="info-link" href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>`;
  $('#info-modal').classList.add('open');
}
function openTrack(){
  $('#info-modal-body').innerHTML = `<h3>Track your order</h3>
    <p>Enter your order number (starts with FM-) and the email you used at checkout.</p>
    <input class="info-input" id="track-num" placeholder="Order number (e.g. FM-1A2B3C4)">
    <input class="info-input" id="track-email" type="email" placeholder="Email used at checkout">
    <button class="info-btn" onclick="doTrack()">Track order</button>
    <p style="text-align:center;margin-top:14px;margin-bottom:0;font-size:12px;color:#86868b">Your order number is in your confirmation email. Lost it? <a class="info-link" href="mailto:${SUPPORT_EMAIL}">Email us</a></p>`;
  $('#info-modal').classList.add('open');
}
function doTrack(){ trackOrder($('#track-num').value, $('#track-email').value); }
async function trackOrder(num, email){
  num = String(num || '').trim().toUpperCase();
  if (!num) { showToast('Enter your order number'); return; }
  try {
    const r = await fetch(`/api/track?order=${encodeURIComponent(num)}&email=${encodeURIComponent(email || '')}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Order not found');
    const tr = j.tracking ? (/^https?:\/\//.test(j.tracking) ? `<a class="info-link" href="${escapeAttr(j.tracking)}" target="_blank" rel="noopener">Track the parcel</a>` : `Tracking number: <b>${escapeHtml(j.tracking)}</b>`) : 'You will get a tracking number by email as soon as it ships.';
    openInfo('Order ' + j.order, `<b>Status:</b> ${escapeHtml(j.status)}<br>Placed ${new Date(j.placed).toLocaleDateString()} · ${money(j.total)}<br><br>${tr}`);
  } catch (e) { showToast(e.message); }
}
wishlist = store.get('fm_wish', []);
function addToWishlist(n, p, img){
  if (wishlist.find(w => w.n === n)) { showToast('Already in your wishlist'); return; }
  wishlist.push({n, p, img, pid:pdpProduct ? pdpProduct.id : undefined}); store.set('fm_wish', wishlist); updateWishCount(); showToast('♥ Added to wishlist');
}
function removeWish(i){ wishlist.splice(i, 1); store.set('fm_wish', wishlist); updateWishCount(); openWishlist(); }

// ---------------- Init ----------------
(function(){
  const gh = $('.g-hero'); if (gh && !$('#demo-banner')) gh.insertAdjacentHTML('afterend', '<div id="demo-banner" class="demo-banner hidden"></div>');
})();
cart = store.get('fm_cart', []);
renderCart();
updateWishCount();
renderHero(); renderPicks(); renderBest(); renderRetro(); renderBoxes(); renderLeagueTiles(); renderPrize();
checkCups();
routeFromHash();
if (location.hash === '#bag' && cart.length) setTimeout(toggleCart, 200);
(function(){ const id = new URLSearchParams(location.search).get('order'); if (id) handleOrderReturn(id); })();
