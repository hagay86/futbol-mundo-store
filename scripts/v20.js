// =====================================================================
// FUTBOL MUNDO v20 — "My gifts". The Welcome pack holds a free jersey,
// and the gift shop sells gifts for Mundo Credits. Gifts are free and ship
// free; they unlock once the account has spent $30 in the shop.
// =====================================================================
const GIFT_UNLOCK = 30;   // gift-shop gifts: free once the account has spent $30
const GIFT_MIN = 40;      // sign-up jersey: free with $40+ of other items in the same order
const isWelcome = g => g && g.src === 'welcome';
let GIFT_PICKS = (() => { try { return JSON.parse(localStorage.getItem('fm_giftpicks') || '{}') || {}; } catch (e) { return {}; } })();
const saveGiftPicks = () => { try { localStorage.setItem('fm_giftpicks', JSON.stringify(GIFT_PICKS)); } catch (e) {} };
const openGifts = () => (ME.gifts || []).filter(g => !g.used);
const giftIcon = g => ({ball:'⚽', box:'🎁', kids:'🧒', pants:'👖'})[g.kind] || '👕';
const giftReady = g => g.kind === 'ball' ? true : g.kind === 'box' ? ((GIFT_PICKS[g.id] || {}).sizes || []).filter(Boolean).length === g.n : g.kind === 'kids' || g.kind === 'pants' ? !!(GIFT_PICKS[g.id] || [])[0] : (GIFT_PICKS[g.id] || []).filter(Boolean).length === g.n;
const GIFT_LEAGUES = ['Any league', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'National Teams'];
const isKidsOutfitP = p => /\bkids?\b/i.test(p.n) && /suit|kit|set/i.test(p.n);
const isPantsP = p => /\bpants?\b|trouser/i.test(p.n) && !/\bkids?\b/i.test(p.n);
const cheapestPants = () => { const all = PRODUCTS.filter(isPantsP); const m = Math.min(...all.map(p => +p.p)); return all.filter(p => +p.p <= m + 0.01); };
function giftBoxSet(gid, k, v){ const b = GIFT_PICKS[gid] && !Array.isArray(GIFT_PICKS[gid]) ? GIFT_PICKS[gid] : {sizes:[], league:'Any league'}; if (k === 'league') b.league = v; else b.sizes[k] = v; GIFT_PICKS[gid] = b; saveGiftPicks(); openMyGifts(); }
const giftSpent = () => +((ME.user && ME.user.spent) || 0);
const giftsUnlocked = () => giftSpent() >= GIFT_UNLOCK;
function cleanGiftPicks(){ const ids = new Set(openGifts().map(g => g.id)); let ch = false; for (const k of Object.keys(GIFT_PICKS)) if (ME.ready && ME.user && !ids.has(k)) { delete GIFT_PICKS[k]; ch = true; } if (ch) saveGiftPicks(); }
const giftLockHTML = () => giftsUnlocked() ? '' : `<div class="gf-lock">🔒 <b>Gifts unlock once you've spent $${GIFT_UNLOCK} in the shop.</b> <span>You've spent ${money(giftSpent())} so far. After that, every gift is free and ships free.</span></div>`;

// scarf leftovers from older saves
try { if (G.items && G.items.some(i => i.key === 'scarf')) { G.items = G.items.filter(i => i.key !== 'scarf'); save(); } } catch (e) {}

// ---------- My gifts page ----------
function openMyGifts(next){
  if (ME.ready && !ME.user) { openAuth('login', 'Sign in to see your gifts.', () => openMyGifts(next)); return; }
  if (next !== undefined) window.__giftNext = next || null;
  next = window.__giftNext;
  const list = ME.gifts || [], open = openGifts(), used = list.filter(g => g.used), ok = giftsUnlocked();
  const row = g => {
    let body, btns = '';
    if (isWelcome(g)) {
      const pk = (GIFT_PICKS[g.id] || [])[0];
      body = pk ? `<div class="gf-pick"><img src="${escapeAttr(pk.img)}" alt=""><div><b class="notranslate">${escapeHtml(pk.n)}</b><span><span>Size</span> <span class="notranslate">${escapeHtml(pk.sz)}</span> · <span>In your bag</span></span></div></div>` : `<span>Pick any jersey for $0. It's free when your order has $${GIFT_MIN} or more of other items.</span>`;
      return `<div class="gf-card"><div class="gf-ico">${giftIcon(g)}</div><div class="gf-main"><b>Sign-up jersey</b>${body}</div><div class="gf-act"><button class="btn ${pk ? 'btn-ghost' : 'btn-gold'} btn-sm" onclick="startGiftShop('${g.id}')">${pk ? 'Change' : 'Choose my free jersey'}</button></div></div>`;
    }
    if (g.kind === 'ball') body = '<span>An official-size match ball.</span>';
    else if (g.kind === 'box') {
      const b = GIFT_PICKS[g.id] && !Array.isArray(GIFT_PICKS[g.id]) ? GIFT_PICKS[g.id] : {sizes:[], league:'Any league'};
      body = `<span>${g.n > 1 ? `${g.n} surprise jerseys from ${g.n} different teams.` : 'A surprise jersey.'} Pick the size${g.n > 1 ? 's' : ''}:</span><div class="gf-box">${Array.from({length:g.n}, (_, k) => `<select onchange="giftBoxSet('${g.id}',${k},this.value)"><option value="">${g.n > 1 ? `Shirt ${k + 1} size` : 'Choose size'}</option>${SIZES_JERSEY.map(z => `<option${b.sizes[k] === z ? ' selected' : ''}>${z}</option>`).join('')}</select>`).join('')}<select onchange="giftBoxSet('${g.id}','league',this.value)">${GIFT_LEAGUES.map(l => `<option${b.league === l ? ' selected' : ''}>${l}</option>`).join('')}</select></div>`;
    } else if (g.kind === 'kids' || g.kind === 'pants') {
      const pk = (GIFT_PICKS[g.id] || [])[0];
      body = pk ? `<div class="gf-pick"><img src="${escapeAttr(pk.img)}" alt=""><div><b class="notranslate">${escapeHtml(pk.n)}</b><span><span>Size</span> <span class="notranslate">${escapeHtml(pk.sz)}</span></span></div></div>` : `<span>${g.kind === 'kids' ? 'Choose any kids outfit (shirt + shorts).' : 'Choose your training pants.'}</span>`;
      btns += `<button class="btn ${pk ? 'btn-ghost' : 'btn-gold'} btn-sm" onclick="openGiftPicker('${g.id}',0)">${pk ? 'Change' : g.kind === 'kids' ? 'Choose the outfit' : 'Choose pants'}</button>`;
    } else {
      const chosen = (GIFT_PICKS[g.id] || []).filter(Boolean);
      body = chosen.length ? chosen.map(pk => `<div class="gf-pick"><img src="${escapeAttr(pk.img)}" alt=""><div><b class="notranslate">${escapeHtml(pk.n)}</b><span><span>Size</span> <span class="notranslate">${escapeHtml(pk.sz)}</span></span></div></div>`).join('') : `<span>${g.n > 1 ? `Choose any ${g.n} jerseys from the shop.` : 'Choose any jersey from the shop.'}</span>`;
      btns += `<button class="btn ${chosen.length ? 'btn-ghost' : 'btn-gold'} btn-sm" onclick="openGiftPicker('${g.id}',0)">${chosen.length ? 'Change' : g.n > 1 ? 'Choose my jerseys' : 'Choose my jersey'}</button>`;
    }
    if (giftReady(g)) btns += ok ? `<button class="btn btn-gold btn-sm" onclick="openGiftAddress('${g.id}')">Get it free</button>` : `<button class="btn btn-ghost btn-sm" disabled>🔒 Locked</button>`;
    return `<div class="gf-card"><div class="gf-ico">${giftIcon(g)}</div><div class="gf-main"><b>${escapeHtml(g.name)}${g.n > 1 && g.kind === 'jersey' ? ` (${g.n} jerseys)` : ''}</b>${body}</div><div class="gf-act">${btns}</div></div>`;
  };
  const html = (open.some(g => !isWelcome(g)) ? giftLockHTML() : '') + (open.length ? open.map(row).join('') : '<p class="gf-empty">No gifts yet. Open your Welcome pack or spend Mundo Credits in the gift shop.</p>') +
    (open.some(g => !isWelcome(g)) ? `<div class="gf-rule">🎁 Gifts are <b>free</b> and ship <b>free</b>. No purchase needed to claim them once your account has spent $${GIFT_UNLOCK} in the shop.</div>` : '') +
    (open.some(isWelcome) ? `<div class="gf-rule">👕 Your sign-up jersey is <b>free</b> with any order that has <b>$${GIFT_MIN} or more</b> of other items.</div>` : '') +
    (used.length ? `<div class="gf-used"><b>Received</b>${used.map(g => `<span>${escapeHtml(g.name)} · order ${escapeHtml(g.used.order || '')}</span>`).join('')}</div>` : '') +
    `<div class="gf-btns">${!ok && open.some(g => !isWelcome(g)) ? `<button class="info-btn" onclick="closeInfo();go('shop')">Shop jerseys</button>` : ''}${next ? `<button class="info-btn gf-sec" onclick="closeInfo();(${next})()">Continue</button>` : ''}</div>`;
  $('#info-modal-body').innerHTML = `<h3>My gifts</h3>${html}`;
  $('#info-modal').classList.add('open');
}

// ---------- jersey picker ----------
let GP = {gid:null, slot:0, q:''};
function openGiftPicker(gid, slot){
  const g = openGifts().find(x => x.id === gid); if (!g) return;
  GP = {gid, slot: slot || 0, q: GP.gid === gid ? GP.q : ''};
  $('#info-modal-body').innerHTML = `<h3>${g.kind === 'kids' ? 'Choose the kids outfit' : g.kind === 'pants' ? 'Choose your pants' : g.n > 1 ? `Choose jersey ${GP.slot + 1} of ${g.n}` : 'Choose your free jersey'}</h3>
    <input id="gp-q" class="gp-q" placeholder="Search a team, e.g. Barcelona" value="${escapeAttr(GP.q)}" oninput="GP.q=this.value;gpList()" autocomplete="off">
    <div id="gp-list" class="gp-list"></div>
    <div class="gf-btns"><button class="info-btn gf-sec" onclick="openMyGifts()">Back to My gifts</button></div>`;
  $('#info-modal').classList.add('open');
  gpList();
  setTimeout(() => { const i = $('#gp-q'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); }, 50);
}
function gpList(){
  const q = GP.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const seen = new Set();
  const g = openGifts().find(x => x.id === GP.gid) || {};
  const base = g.kind === 'kids' ? PRODUCTS.filter(isKidsOutfitP) : g.kind === 'pants' ? cheapestPants() : PRODUCTS.filter(isShirt);
  const res = base.filter(p => (!q.length || q.every(w => (p.n + ' ' + (p.t || '')).toLowerCase().includes(w))) && !seen.has(p.n) && seen.add(p.n))
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
  const arr = (Array.isArray(GIFT_PICKS[g.id]) ? GIFT_PICKS[g.id] : []).slice(0, g.n || 1); arr[GP.slot] = {pid, n:p.n, img:p.i, sz};
  GIFT_PICKS[g.id] = arr; saveGiftPicks();
  const nextSlot = Array.from({length:(g.kind === 'kids' || g.kind === 'pants') ? 1 : g.n}, (_, k) => k).find(k => !arr[k]);
  if (nextSlot !== undefined) { GP.q = ''; openGiftPicker(g.id, nextSlot); return; }
  if (giftsUnlocked()) { openGiftAddress(g.id); return; }
  $('#info-modal-body').innerHTML = `<h3>Gift saved 🎁</h3>${giftLockHTML()}<p>Your choice is saved in My gifts. Once your account has spent $${GIFT_UNLOCK} in the shop, tap <b>Get it free</b> and we ship it to you for free.</p>
    <div class="gf-btns"><button class="info-btn" onclick="closeInfo();go('shop')">Shop jerseys</button><button class="info-btn gf-sec" onclick="openMyGifts()">Back to My gifts</button></div>`;
}

// ---------- claim: delivery address, then a free order ----------
function openGiftAddress(gid){
  const g = openGifts().find(x => x.id === gid); if (!g) return;
  if (!giftsUnlocked()) { openMyGifts(); return; }
  $('#info-modal-body').innerHTML = `<h3>Where should we send it?</h3><p class="gf-sub">Your gift and the shipping are free.</p><div class="gf-addr">${addrHTML().replace('<h2 class="co-h2">Delivery details</h2>', '')}</div>
    <div class="gf-btns"><button class="info-btn" id="gf-send" onclick="sendGift('${gid}')">Send my free gift</button><button class="info-btn gf-sec" onclick="openMyGifts()">Back to My gifts</button></div>`;
}
function giftAddrValid(){
  const a = Object.assign({}, COADDR); if (!a.country) a.country = guessCountry();
  const d = {name:(a.name || '').trim(), phone:(a.phone || '').trim(), line1:(a.line1 || '').trim(), line2:(a.line2 || '').trim(), city:(a.city || '').trim(), state:(a.state || '').trim(), zip:(a.zip || '').trim(), country:a.country || ''};
  const bad = d.name.length < 3 ? 'name' : !d.country ? 'country' : d.phone.replace(/\D/g, '').length < 7 ? 'phone' : d.line1.length < 3 ? 'line1' : d.city.length < 2 ? 'city' : '';
  if (!bad) return d;
  const el = $('#ad-' + bad); if (el) { el.classList.add('err'); el.focus(); }
  showToast({name:'Enter your full name', country:'Choose your country', phone:'Enter a phone number with the country code', line1:'Enter your street address', city:'Enter your city'}[bad]);
  return null;
}
async function sendGift(gid){
  const g = openGifts().find(x => x.id === gid), addr = giftAddrValid(); if (!g || !addr) return;
  const btn = $('#gf-send'); btn.disabled = true;
  try {
    const pk = GIFT_PICKS[gid] || [], box = !Array.isArray(pk) ? pk : null;
    const j = await api('/api/auth?action=claimgift', {method:'POST', body:{gid, addr, lang:I18N.lang, picks:Array.isArray(pk) ? pk.filter(Boolean).map(x => ({pid:x.pid, n:x.n, sz:x.sz})) : [], sizes:box ? box.sizes : [], league:box ? box.league : ''}});
    ME.gifts = j.gifts || ME.gifts; delete GIFT_PICKS[gid]; saveGiftPicks(); try { loadMe(); } catch (e) {}
    $('#info-modal-body').innerHTML = `<h3>Your gift is on its way 🎁</h3><p>Order <b class="notranslate">${escapeHtml(j.order)}</b>. We emailed you the details and we'll send the tracking number when it ships.</p>
      <div class="gf-btns"><button class="info-btn" onclick="openMyGifts()">My gifts</button>${window.__giftNext ? `<button class="info-btn gf-sec" onclick="closeInfo();(${window.__giftNext})()">Continue</button>` : ''}</div>`;
  } catch (e) { showToast(e.message); btn.disabled = false; }
}

// ---------- sign-up jersey: shop selection mode (every jersey $0) ----------
let GIFT_MODE = null;
function startGiftShop(gid){
  GIFT_MODE = gid; document.body.classList.add('gift-mode'); closeInfo();
  let bar = $('#gift-bar'); if (!bar) { document.body.insertAdjacentHTML('beforeend', '<div id="gift-bar" class="gift-bar"></div>'); bar = $('#gift-bar'); }
  bar.innerHTML = `<span>🎁</span><div><b>Pick your free jersey</b><small>Every jersey is $0. Free with $${GIFT_MIN}+ of other items in your order.</small></div><button onclick="stopGiftShop()">Cancel</button>`;
  try { if (typeof shopCat !== 'undefined') shopCat = 'all'; } catch (e) {}
  go('shop'); try { renderShop(); } catch (e) {}
}
function stopGiftShop(){ GIFT_MODE = null; document.body.classList.remove('gift-mode'); $('#gift-bar')?.remove(); try { renderShop(); } catch (e) {} }
const _productCard20 = productCard;
productCard = function(p){
  const h = _productCard20(p);
  return GIFT_MODE && p.shirt ? h.replace(/<div class="price">[\s\S]*?<\/div>/, `<div class="price gift-price">$0.00 <s>${money(p.p)}</s></div>`) : h;
};
const _openP20 = openP;
openP = function(id){
  _openP20(id);
  const p = PRODUCTS[id], on = !!(GIFT_MODE && p && p.shirt);
  $('#pdp-overlay')?.classList.toggle('gift-pdp', on);
  if (!on) return;
  document.querySelectorAll('#pdp-overlay .pdp-opt').forEach(e => e.remove());
  const ns = $('#pdp-cname')?.closest('.pdp-section'); if (ns) ns.style.display = 'none';
  $('#pdp-price').textContent = '$0.00'; $('#pdp-orig').textContent = money(p.p); $('#pdp-save').textContent = 'Free gift';
  const b = $('#pdp-overlay .btn-cart'); if (b) b.textContent = 'Add as my free jersey';
};
const _pdpAdd20 = pdpAddToCart, _pdpBuy20 = pdpBuyNow;
function giftPdpPick(){
  const p = pdpProduct, g = openGifts().find(x => x.id === GIFT_MODE); if (!p || !g) return false;
  const sel = $('#pdp-sizes .sz.sel, #pdp-sizes .sz.on, #pdp-sizes .sz.active');
  const sz = (window.pdpSize || window.selectedSize || (sel && sel.textContent.trim()) || '');
  if (!sz) { showToast('Choose a size first'); return true; }
  GIFT_PICKS[g.id] = [{pid:p.id, n:p.n, img:p.i, sz}]; saveGiftPicks();
  const ns = $('#pdp-cname')?.closest('.pdp-section'); if (ns) ns.style.display = '';
  stopGiftShop(); closePDP(); renderCart();
  showToast(merchTotal(cart) >= GIFT_MIN ? 'Free jersey added to your bag' : `Free jersey saved. Add $${GIFT_MIN}+ of other items to get it`);
  setTimeout(toggleCart, 300);
  return true;
}
pdpAddToCart = function(){ if (GIFT_MODE && pdpProduct && pdpProduct.shirt) { giftPdpPick(); return; } return _pdpAdd20.apply(this, arguments); };
pdpBuyNow = function(){ if (GIFT_MODE && pdpProduct && pdpProduct.shirt) { if (giftPdpPick()) setTimeout(openCheckout, 600); return; } return _pdpBuy20.apply(this, arguments); };

// ---------- bag + checkout ----------
const welcomeGift = () => openGifts().find(g => isWelcome(g) && (GIFT_PICKS[g.id] || [])[0]);
function giftLinesHTML(cls){
  const g = welcomeGift(); if (!g) return '';
  const pk = GIFT_PICKS[g.id][0];
  return `<div class="${cls}"><img src="${escapeAttr(pk.img)}" alt=""><div class="gfl-info"><div class="gfl-name notranslate">🎁 ${escapeHtml(pk.n)}</div><div class="gfl-meta"><span>Size</span> <span class="notranslate">${escapeHtml(pk.sz)}</span> · <span>Free gift</span> · <a href="javascript:void 0" onclick="dropWelcomePick()">Remove</a></div></div><div class="gfl-price">$0.00</div></div>`;
}
function dropWelcomePick(){ const g = welcomeGift(); if (g) { delete GIFT_PICKS[g.id]; saveGiftPicks(); renderCart(); try { renderCheckout(); } catch (e) {} } }
scarfNote = function(items){
  const g = welcomeGift(), others = openGifts().filter(x => !isWelcome(x)).length;
  let h = '';
  if (g) {
    const m = merchTotal(items || cart);
    h += `<div class="gfl-wrap${m >= GIFT_MIN ? '' : ' off'}">${giftLinesHTML('gfl')}</div>` + (m >= GIFT_MIN ? `<div class="scarf-ok">🎁 Your free jersey ships with this order</div>` : `<div class="scarf-todo">Add <b>${money(GIFT_MIN - m)}</b> more to get your free jersey. It's free with $${GIFT_MIN} or more of other items.</div>`);
  } else if (ME.user && openGifts().some(isWelcome)) h += `<div class="scarf-todo gf-link" onclick="startGiftShop('${openGifts().find(isWelcome).id}')">🎁 Your sign-up jersey is waiting. <u>Pick it for $0</u></div>`;
  if (others && ME.user) h += `<div class="scarf-todo gf-link" onclick="openMyGifts()">🎁 You have a free gift waiting. <u>Open My gifts</u></div>`;
  return h;
};
function giftSumHTML(){ return welcomeGift() && merchTotal(cart) >= GIFT_MIN ? giftLinesHTML('co-sum-item gfl-sum') : ''; }
const _coItems20 = coItems;
coItems = function(){
  const items = _coItems20(), g = welcomeGift();
  if (g && merchTotal(cart) >= GIFT_MIN) items.push({kind:'gift', gid:g.id, picks:GIFT_PICKS[g.id].map(pk => ({pid:pk.pid, n:pk.n, sz:pk.sz}))});
  return items;
};
// after a paid order: refresh (the $30 unlock may have just been reached)
const _handleOrderReturn20 = handleOrderReturn;
handleOrderReturn = async function(){ const r = await _handleOrderReturn20.apply(this, arguments); try { await loadMe(); cleanGiftPicks(); renderCart(); } catch (e) {} return r; };

// ---------- Welcome pack: rookie + free jersey ----------
grantWelcome = async function(){
  if (G.welcomeOpened) return true;
  if (ME.ready) {
    if (!ME.user) return false;
    try { const j = await api('/api/auth?action=welcome', {method:'POST'}); if (j.gifts) ME.gifts = j.gifts; if (!j.granted && G.welcomeOpened) return true; } catch (e) { showToast(e.message); return false; }
  }
  const before = new Set(G.cards.map(c => c.id));
  G.starterXI = 0; grantStarterXI();   // the 11 academy players come in the sign-up pack
  const xi = G.cards.filter(c => !before.has(c.id)); xi.forEach(c => { c.noob = true; });
  const gift = {item:true, key:'gift', id:newId(), name:'Free jersey', emoji:'🎁', desc:`Any jersey for $0 with a $${GIFT_MIN}+ order`};
  G.welcomeOpened = Date.now();
  save(); objCheck(); renderCart();
  showPackReveal('Sign-up pack', 'p-welcome', xi.concat(gift), 'Your first 11 players and a FREE jersey', 'welcomeGiftNext');
  return true;
};
function welcomeGiftNext(){ openMyGifts('tutStep4'); }

// ---------- gift shop ----------
renderRewards = function(){
  const open = openGifts();
  $('#rewards').innerHTML = giftLockHTML() + `<div class="reward gf-mine" onclick="openMyGifts()" role="button"><div class="rp">🎁 ${open.length}</div><b>My gifts</b><span>${open.length ? `You have ${open.length} gift${open.length > 1 ? 's' : ''} to use. Gifts are free and ship free.` : 'Gifts you get show up here.'}</span><button class="btn btn-gold btn-sm">Open My gifts</button></div>` +
    GIFTS.map((g, i) => (ME.bought || []).includes(g.name) ? '' : `<div class="reward${giftsUnlocked() ? '' : ' locked'}"><div class="rp">${giftsUnlocked() ? '' : '🔒 '}Ɱ${g.pts.toLocaleString()}</div><div class="rw-ico">${g.ico || '🎁'}</div><b>${g.name}</b><span>${g.txt}</span>
    ${!giftsUnlocked() ? `<button class="btn btn-ghost btn-sm" onclick="openMyGifts()">🔒 Unlocks at $${GIFT_UNLOCK} spent</button>` : `<button class="btn ${G.points >= g.pts ? 'btn-pri' : 'btn-ghost'} btn-sm" onclick="claimGift(${i})">${G.points >= g.pts ? 'Get gift' : `Ɱ${(g.pts - G.points).toLocaleString()} to go`}</button>`}</div>`).join('');
  $('#point-table').innerHTML = RARITY.map(r => `<div><span>${r.label}</span><b>Ɱ${r.pts.toLocaleString()}</b></div>`).join('');
  const pg = $('#packs-gifts'); if (pg && typeof pointPacksHTML === 'function') pg.innerHTML = pointPacksHTML();
};
claimGift = async function(i){
  const g = GIFTS[i];
  if (!ME.user) { openAuth('login', 'Sign in to get gifts.', () => claimGift(i)); return; }
  if (!giftsUnlocked()) { openMyGifts(); return; }
  if (G.points < g.pts) { showToast(`You need ${(g.pts - G.points).toLocaleString()} more Mundo Credits`); return; }
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
