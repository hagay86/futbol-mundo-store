// =====================================================================
// FUTBOL MUNDO v20 — "My gifts". The Welcome pack holds a free jersey
// (gift shop items too). Pick the jersey in My gifts; it ships free with
// any order of $40+ in paid items. Under $40 the gift stays unused.
// The club scarf is gone.
// =====================================================================
const GIFT_MIN = 40;
let GIFT_PICKS = (() => { try { return JSON.parse(localStorage.getItem('fm_giftpicks') || '{}') || {}; } catch (e) { return {}; } })();
const saveGiftPicks = () => { try { localStorage.setItem('fm_giftpicks', JSON.stringify(GIFT_PICKS)); } catch (e) {} };
const openGifts = () => (ME.gifts || []).filter(g => !g.used);
const giftIcon = g => g.kind === 'ball' ? '⚽' : '👕';
const giftReady = g => g.kind === 'ball' ? !!GIFT_PICKS[g.id] : (GIFT_PICKS[g.id] || []).filter(Boolean).length === g.n;
function cleanGiftPicks(){ const ids = new Set(openGifts().map(g => g.id)); let ch = false; for (const k of Object.keys(GIFT_PICKS)) if (ME.ready && ME.user && !ids.has(k)) { delete GIFT_PICKS[k]; ch = true; } if (ch) saveGiftPicks(); }

// scarf leftovers from older saves
try { if (G.items && G.items.some(i => i.key === 'scarf')) { G.items = G.items.filter(i => i.key !== 'scarf'); save(); } } catch (e) {}

// ---------- My gifts page ----------
function openMyGifts(next){
  if (ME.ready && !ME.user) { openAuth('login', 'Sign in to see your gifts.', () => openMyGifts(next)); return; }
  window.__giftNext = next || null;
  const list = ME.gifts || [], open = openGifts(), used = list.filter(g => g.used);
  const row = g => {
    const picks = GIFT_PICKS[g.id];
    let body, btn;
    if (g.kind === 'ball') {
      body = picks ? `<span class="gf-ok">Added to your next order of $${GIFT_MIN}+</span>` : '<span>An official-size match ball, free with your next order.</span>';
      btn = picks ? `<button class="btn btn-ghost btn-sm" onclick="giftBall('${g.id}',0)">Remove</button>` : `<button class="btn btn-gold btn-sm" onclick="giftBall('${g.id}',1)">Add to my order</button>`;
    } else {
      const chosen = (picks || []).filter(Boolean);
      body = chosen.length ? chosen.map(pk => `<div class="gf-pick"><img src="${escapeAttr(pk.img)}" alt=""><div><b class="notranslate">${escapeHtml(pk.n)}</b><span>Size ${escapeHtml(pk.sz)}</span></div></div>`).join('') : `<span>${g.n > 1 ? `Choose any ${g.n} jerseys from the shop.` : 'Choose any jersey from the shop.'}</span>`;
      btn = `<button class="btn ${chosen.length ? 'btn-ghost' : 'btn-gold'} btn-sm" onclick="openGiftPicker('${g.id}',0)">${chosen.length ? 'Change' : g.n > 1 ? 'Choose my jerseys' : 'Choose my jersey'}</button>`;
    }
    return `<div class="gf-card"><div class="gf-ico">${giftIcon(g)}</div><div class="gf-main"><b>${escapeHtml(g.name)}${g.n > 1 && g.kind === 'jersey' ? ` (${g.n} jerseys)` : ''}</b>${body}</div><div class="gf-act">${btn}</div></div>`;
  };
  const html = (open.length ? open.map(row).join('') : '<p class="gf-empty">No gifts yet. Open your Welcome pack or spend Mundo Credits in the gift shop.</p>') +
    `<div class="gf-rule">🎁 Your gift ships <b>free</b> with any order of <b>$${GIFT_MIN} or more</b>. Orders under $${GIFT_MIN} don't include the gift, and it stays in My gifts for later.</div>` +
    (used.length ? `<div class="gf-used"><b>Received</b>${used.map(g => `<span>${escapeHtml(g.name)} · order ${escapeHtml(g.used.order || '')}</span>`).join('')}</div>` : '') +
    `<div class="gf-btns">${open.some(giftReady) ? `<button class="info-btn" onclick="closeInfo();go('shop')">Shop to reach $${GIFT_MIN}</button>` : ''}${next ? `<button class="info-btn gf-sec" onclick="closeInfo();(${next})()">Continue</button>` : ''}</div>`;
  $('#info-modal-body').innerHTML = `<h3>My gifts</h3>${html}`;
  $('#info-modal').classList.add('open');
}
function giftBall(id, on){ if (on) GIFT_PICKS[id] = 1; else delete GIFT_PICKS[id]; saveGiftPicks(); renderCart(); openMyGifts(window.__giftNext); }

// ---------- jersey picker ----------
let GP = {gid:null, slot:0, q:''};
function openGiftPicker(gid, slot){
  const g = openGifts().find(x => x.id === gid); if (!g) return;
  GP = {gid, slot: slot || 0, q: GP.gid === gid ? GP.q : ''};
  $('#info-modal-body').innerHTML = `<h3>${g.n > 1 ? `Choose jersey ${GP.slot + 1} of ${g.n}` : 'Choose your free jersey'}</h3>
    <input id="gp-q" class="gp-q" placeholder="Search a team, e.g. Barcelona" value="${escapeAttr(GP.q)}" oninput="GP.q=this.value;gpList()" autocomplete="off">
    <div id="gp-list" class="gp-list"></div>
    <div class="gf-btns"><button class="info-btn gf-sec" onclick="openMyGifts(window.__giftNext)">Back to My gifts</button></div>`;
  $('#info-modal').classList.add('open');
  gpList();
  setTimeout(() => { const i = $('#gp-q'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); }, 50);
}
function gpList(){
  const q = GP.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const seen = new Set();
  const res = PRODUCTS.filter(p => isShirt(p) && (!q.length || q.every(w => (p.n + ' ' + (p.t || '')).toLowerCase().includes(w))) && !seen.has(p.n) && seen.add(p.n))
    .sort((a, b) => (/26\/27/.test(b.n) - /26\/27/.test(a.n)) || (b.x ? 1 : 0) - (a.x ? 1 : 0)).slice(0, 48);
  $('#gp-list').innerHTML = res.length ? res.map(p => `<button class="gp-item" onclick="gpChoose(${p.id})"><img src="${escapeAttr(p.i)}" alt="" loading="lazy"><span class="notranslate">${escapeHtml(p.n)}</span></button>`).join('') : '<p class="gf-empty">No jerseys match that search.</p>';
}
function gpChoose(pid){
  const p = PRODUCTS[pid]; if (!p) return;
  const sizes = (p.sz && p.sz.length ? p.sz : getSizes(p.n));
  $('#info-modal-body').innerHTML = `<h3>Pick your size</h3>
    <div class="gf-pick gp-sel"><img src="${escapeAttr(p.i)}" alt=""><div><b class="notranslate">${escapeHtml(p.n)}</b><span>Free gift</span></div></div>
    <div class="gp-sizes">${sizes.map(s => `<button class="gp-size" onclick="gpSave(${pid},'${escapeAttr(s).replace(/'/g, "\\'")}')">${escapeHtml(s)}</button>`).join('')}</div>
    <div class="gf-btns"><button class="info-btn gf-sec" onclick="openGiftPicker('${GP.gid}',${GP.slot})">Back</button></div>`;
}
function gpSave(pid, sz){
  const p = PRODUCTS[pid], g = openGifts().find(x => x.id === GP.gid); if (!p || !g) return;
  const arr = (GIFT_PICKS[g.id] || []).slice(0, g.n); arr[GP.slot] = {pid, n:p.n, img:p.i, sz};
  GIFT_PICKS[g.id] = arr; saveGiftPicks(); renderCart();
  const nextSlot = Array.from({length:g.n}, (_, k) => k).find(k => !arr[k]);
  if (nextSlot !== undefined) { GP.q = ''; openGiftPicker(g.id, nextSlot); return; }
  const m = merchTotal(cart);
  $('#info-modal-body').innerHTML = `<h3>Gift saved 🎁</h3><p>${g.n > 1 ? 'Your jerseys are' : 'Your jersey is'} in your bag for <b>$0.00</b>. ${m >= GIFT_MIN ? `Your bag is over $${GIFT_MIN}, so it ships free with this order.` : `Add <b>${money(GIFT_MIN - m)}</b> more to your bag (orders of $${GIFT_MIN}+) and it ships free with your order.`}</p>
    <div class="gf-btns"><button class="info-btn" onclick="closeInfo();go('shop')">Shop jerseys</button>${cart.length ? `<button class="info-btn gf-sec" onclick="closeInfo();toggleCart()">View bag</button>` : ''}${window.__giftNext ? `<button class="info-btn gf-sec" onclick="closeInfo();(${window.__giftNext})()">Continue</button>` : ''}</div>`;
}

// ---------- bag + checkout ----------
function giftLinesHTML(cls){
  const ready = openGifts().filter(giftReady); if (!ready.length) return '';
  const rows = [];
  for (const g of ready) {
    if (g.kind === 'ball') rows.push({img:'', ico:'⚽', n:'Match ball', meta:'Free gift'});
    else for (const pk of GIFT_PICKS[g.id]) rows.push({img:pk.img, n:pk.n, sz:pk.sz, meta:'Free gift'});
  }
  return rows.map(r => `<div class="${cls}">${r.img ? `<img src="${escapeAttr(r.img)}" alt="">` : `<div class="co-scarf-ico">${r.ico}</div>`}<div class="gfl-info"><div class="gfl-name notranslate">🎁 ${escapeHtml(r.n)}</div><div class="gfl-meta">${r.sz ? `<span>Size</span> <span class="notranslate">${escapeHtml(r.sz)}</span> · ` : ''}<span>${escapeHtml(r.meta)}</span></div></div><div class="gfl-price">$0.00</div></div>`).join('');
}
// replaces the old scarf note in the bag drawer and the checkout bag
scarfNote = function(items){
  const ready = openGifts().filter(giftReady), waiting = openGifts().filter(g => !giftReady(g));
  if (!ready.length) return waiting.length && ME.user ? `<div class="scarf-todo gf-link" onclick="openMyGifts()">🎁 You have a free gift waiting. <u>Choose it</u></div>` : '';
  const m = merchTotal(items);
  const lines = `<div class="gfl-wrap${m >= GIFT_MIN ? '' : ' off'}">${giftLinesHTML('gfl')}</div>`;
  return lines + (m >= GIFT_MIN ? `<div class="scarf-ok">🎁 Your free gift ships with this order</div>` : `<div class="scarf-todo">Add <b>${money(GIFT_MIN - m)}</b> more to get your free gift. Gifts ship with orders of $${GIFT_MIN} or more.</div>`);
};
function giftSumHTML(){ return merchTotal(cart) >= GIFT_MIN ? giftLinesHTML('co-sum-item gfl-sum') : ''; }
const _coItems20 = coItems;
coItems = function(){
  const items = _coItems20();
  if (merchTotal(cart) >= GIFT_MIN) for (const g of openGifts().filter(giftReady)) items.push(g.kind === 'ball' ? {kind:'gift', gid:g.id} : {kind:'gift', gid:g.id, picks:GIFT_PICKS[g.id].map(pk => ({pid:pk.pid, n:pk.n, sz:pk.sz}))});
  return items;
};
// after a paid order: refresh gifts (used ones disappear from the bag)
const _handleOrderReturn20 = handleOrderReturn;
handleOrderReturn = async function(){ const r = await _handleOrderReturn20.apply(this, arguments); try { await loadMe(); cleanGiftPicks(); renderCart(); } catch (e) {} return r; };

// ---------- Welcome pack: rookie + free jersey ----------
grantWelcome = async function(){
  if (G.welcomeOpened) return true;
  if (ME.ready) {
    if (!ME.user) return false;
    try { const j = await api('/api/auth?action=welcome', {method:'POST'}); if (j.gifts) ME.gifts = j.gifts; if (!j.granted && G.welcomeOpened) return true; } catch (e) { showToast(e.message); return false; }
  }
  const rookie = randomCard({lo:40, hi:47, skew:1}); rookie.noob = true;
  const gift = {item:true, key:'gift', id:newId(), name:'Free jersey', emoji:'🎁', desc:`Any jersey, free with an order of $${GIFT_MIN}+`};
  G.cards.push(rookie); G.welcomeOpened = Date.now();
  save(); objCheck(); renderCart();
  showPackReveal('Welcome pack', 'p-welcome', [rookie, gift], 'Your first real player and a FREE jersey', 'welcomeGiftNext');
  return true;
};
function welcomeGiftNext(){ openMyGifts('tutStep4'); }

// ---------- gift shop ----------
renderRewards = function(){
  const open = openGifts();
  $('#rewards').innerHTML = `<div class="reward gf-mine" onclick="openMyGifts()" role="button"><div class="rp">🎁 ${open.length}</div><b>My gifts</b><span>${open.length ? `You have ${open.length} gift${open.length > 1 ? 's' : ''} to use. Each ships free with an order of $${GIFT_MIN}+.` : 'Gifts you get show up here.'}</span><button class="btn btn-gold btn-sm">Open My gifts</button></div>` +
    GIFTS.map((g, i) => (ME.bought || []).includes(g.name) ? '' : `<div class="reward"><div class="rp">Ɱ${g.pts.toLocaleString()}</div><b>${g.name}</b><span>${g.txt}</span>
    <button class="btn ${G.points >= g.pts ? 'btn-pri' : 'btn-ghost'} btn-sm" onclick="claimGift(${i})">${G.points >= g.pts ? 'Get gift' : `Ɱ${(g.pts - G.points).toLocaleString()} to go`}</button></div>`).join('');
  $('#point-table').innerHTML = RARITY.map(r => `<div><span>${r.label}</span><b>Ɱ${r.pts.toLocaleString()}</b></div>`).join('');
  const pg = $('#packs-gifts'); if (pg && typeof pointPacksHTML === 'function') pg.innerHTML = pointPacksHTML();
};
claimGift = async function(i){
  const g = GIFTS[i];
  if (G.points < g.pts) { showToast(`You need ${(g.pts - G.points).toLocaleString()} more Mundo Credits`); return; }
  if (!ME.user) { openAuth('login', 'Sign in to get gifts.', () => claimGift(i)); return; }
  try {
    const j = await api('/api/auth?action=gift', {method:'POST', body:{name:g.name}});
    G.points -= g.pts; save();
    if (j.bought) ME.bought = j.bought;
    if (j.gifts) { ME.gifts = j.gifts; renderRewards(); renderCart(); openMyGifts(); }
    else { G.gifts.push(`${g.name} · ${j.claim}`); save(); renderRewards(); openInfo('You are in the draw', `Entry <b>${j.claim}</b> is in. We'll email you if you win.`); }
  } catch (e) { if (e.status === 409) { ME.bought = (ME.bought || []).concat(g.name); renderRewards(); } showToast(e.message); }
};

// ---------- hub banner ----------
const _renderHome20 = renderHome;
renderHome = function(){
  _renderHome20();
  const n = openGifts().length, h = $('#home-main'); if (!n || !h) return;
  h.insertAdjacentHTML('afterbegin', `<button class="gf-banner" onclick="openMyGifts()"><span>🎁</span><b>You have ${n === 1 ? 'a free gift' : n + ' free gifts'}</b><em>Open My gifts</em></button>`);
};
// ?redeem=CODE (link in the codes email): open Redeem with the code filled in
(() => { const rc = (new URLSearchParams(location.search).get('redeem') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30); if (!rc) return;
  history.replaceState(null, '', location.pathname + '#game/redeem');
  try { sessionStorage.setItem('fm_xi_in', '1'); } catch (e) {}
  let n = 0; const t = setInterval(() => { const inp = $('#code-in'); if (inp && inp.offsetParent) { inp.value = rc; inp.focus(); clearInterval(t); showToast('Your code is ready. Tap Redeem'); } else if (++n > 40) clearInterval(t); else if (n % 4 === 1) { try { go('game', 'redeem'); gTab('redeem'); } catch (e) {} } }, 300); })();
// gifts arrive with the account info
(async () => { try { if (!ME.gifts) { const j = await api('/api/auth?action=me'); if (!ME.gifts) { ME.gifts = j.gifts || []; ME.bought = j.bought || []; } } } catch (e) {} cleanGiftPicks(); renderCart(); try { if (currentView === 'game') renderGame(); } catch (e) {} })();
