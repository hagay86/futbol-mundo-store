// =====================================================================
// FUTBOL MUNDO v5 — accounts (sign up / sign in / reset), cloud saves,
// codes emailed after purchase, FUT-style cards & hub, objectives,
// daily demo pack and the first-time tutorial with the Welcome pack.
// =====================================================================
const ME = {user:null, ready:false, orders:[]};
G.items = G.items || [];
G.obj = G.obj || {};
G.tut = G.tut || 0;

// ---------------- API helper ----------------
async function api(path, opt = {}){
  const r = await fetch(path, Object.assign({headers:{'Content-Type':'application/json'}, credentials:'same-origin'}, opt, opt.body ? {body:JSON.stringify(opt.body)} : {}));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Something went wrong'), {status:r.status});
  return j;
}

// ---------------- Account state ----------------
async function loadMe(){
  try { const j = await api('/api/auth?action=me'); ME.user = j.user; ME.ready = !!j.ready; ME.orders = j.orders || []; } catch (e) { ME.ready = false; }
  if (ME.user) { G.spent = ME.user.spent || 0; await syncLoad(); }
  paintAccountIcon();
  if (currentView === 'game') renderGame();
}
function paintAccountIcon(){
  const b = document.querySelector('.hdr-actions [aria-label="Account"]'); if (!b) return;
  let dot = b.querySelector('.acc-dot');
  if (ME.user) { if (!dot) { dot = document.createElement('span'); dot.className = 'acc-dot'; b.appendChild(dot); } dot.textContent = (ME.user.name || ME.user.email)[0].toUpperCase(); }
  else if (dot) dot.remove();
}

// ---------------- Auth modal ----------------
let AUTH_NEXT = null;
function openAuth(mode = 'signup', reason = '', next = null){
  AUTH_NEXT = next;
  if (!ME.ready) { openInfo('Accounts are almost ready', 'Sign-up opens in a few moments while we finish switching it on. You can keep browsing and shopping.'); return; }
  const tabs = `<div class="auth-tabs"><button class="${mode === 'signup' ? 'on' : ''}" onclick="openAuth('signup', AUTH_REASON, AUTH_NEXT)">Create account</button><button class="${mode === 'login' ? 'on' : ''}" onclick="openAuth('login', AUTH_REASON, AUTH_NEXT)">Sign in</button></div>`;
  window.AUTH_REASON = reason;
  const forms = {
    signup: `<input class="info-input" id="au-name" placeholder="Manager name (optional)" maxlength="40" autocomplete="nickname">
      <input class="info-input" id="au-email" type="email" placeholder="Email" autocomplete="email">
      <input class="info-input" id="au-pw" type="password" placeholder="Password (8+ characters)" autocomplete="new-password">
      <button class="info-btn" id="au-go" onclick="doAuth('signup')">Create my account</button>
      <p class="auth-fine">Your Mundo XI codes and order updates are sent to this email.</p>`,
    login: `<input class="info-input" id="au-email" type="email" placeholder="Email" autocomplete="email">
      <input class="info-input" id="au-pw" type="password" placeholder="Password" autocomplete="current-password" onkeydown="if(event.key==='Enter')doAuth('login')">
      <button class="info-btn" id="au-go" onclick="doAuth('login')">Sign in</button>
      <p class="auth-fine"><span class="info-link" onclick="openAuth('forgot', AUTH_REASON, AUTH_NEXT)">Forgot your password?</span></p>`,
    forgot: `<p>Enter your email and we'll send you a link to choose a new password.</p>
      <input class="info-input" id="au-email" type="email" placeholder="Email" autocomplete="email">
      <button class="info-btn" id="au-go" onclick="doAuth('forgot')">Send reset link</button>
      <p class="auth-fine"><span class="info-link" onclick="openAuth('login', AUTH_REASON, AUTH_NEXT)">Back to sign in</span></p>`,
  };
  $('#info-card').classList.remove('wide');
  $('#info-modal-body').innerHTML = `<h3>${mode === 'forgot' ? 'Reset password' : mode === 'login' ? 'Welcome back' : 'Join Futbol Mundo'}</h3>${reason ? `<p class="auth-reason">${reason}</p>` : ''}${mode === 'forgot' ? '' : tabs}<div class="auth-form">${forms[mode]}</div><div class="auth-err" id="au-err"></div>`;
  $('#info-modal').classList.add('open');
  setTimeout(() => ($('#au-name') || $('#au-email'))?.focus(), 50);
}
async function doAuth(mode){
  const btn = $('#au-go'), err = $('#au-err'); err.textContent = ''; btn.disabled = true;
  const email = $('#au-email')?.value.trim(), password = $('#au-pw')?.value || '', name = $('#au-name')?.value.trim();
  try {
    const j = await api('/api/auth?action=' + mode, {method:'POST', body:{email, password, name}});
    if (mode === 'forgot') { $('#info-modal-body').innerHTML = `<h3>Check your email</h3><p>If ${escapeHtml(email)} has an account, a reset link is on its way. It works for 1 hour.</p><button class="info-btn" onclick="closeInfo()">Got it</button>`; return; }
    ME.user = j.user; closeInfo();
    showToast(mode === 'signup' ? `Welcome, ${ME.user.name || 'manager'}! Check your email to confirm it` : 'Signed in');
    await loadMe();
    const n = AUTH_NEXT; AUTH_NEXT = null; if (n) n();
  } catch (e) { err.textContent = e.message; btn.disabled = false; }
}
async function signOut(){
  await api('/api/auth?action=logout', {method:'POST'}).catch(() => {});
  try { localStorage.removeItem('fm_xi2'); } catch (e) {}
  location.href = '/';
}
function openReset(t){
  $('#info-modal-body').innerHTML = `<h3>Choose a new password</h3><input class="info-input" id="au-pw" type="password" placeholder="New password (8+ characters)" autocomplete="new-password"><button class="info-btn" id="au-go" onclick="doReset('${escapeAttr(t)}')">Save password</button><div class="auth-err" id="au-err"></div>`;
  $('#info-modal').classList.add('open');
}
async function doReset(t){
  const err = $('#au-err'); err.textContent = '';
  try { const j = await api('/api/auth?action=reset', {method:'POST', body:{token:t, password:$('#au-pw').value}}); ME.user = j.user; closeInfo(); showToast('Password saved. You are signed in'); loadMe(); }
  catch (e) { err.textContent = e.message; }
}

// ---------------- Cloud save ----------------
let CLOUD_T = null;
const _saveLocal = save;
save = function(){ G.savedAt = Date.now(); _saveLocal(); if (ME.user) { clearTimeout(CLOUD_T); CLOUD_T = setTimeout(pushCloud, 2500); } };
async function pushCloud(){ if (!ME.user) return; G.owner = ME.user.email; try { await api('/api/save', {method:'PUT', body:{data:G}}); } catch (e) {} }
async function syncLoad(){
  try {
    const {data} = await api('/api/save');
    const mine = G.owner === ME.user.email;
    if (data && (!mine || (data.savedAt || 0) > (G.savedAt || 0))) {
      Object.keys(G).forEach(k => delete G[k]);
      Object.assign(G, {cards:[], squad:{}, points:0, gifts:[], used:[], issued:{}, listings:null, mine:[], packs:[], cupEntries:[], cupLive:[], cupHistory:[], trophies:[], items:[], obj:{}, orders:[]}, data);
      _saveLocal();
    } else { G.owner = ME.user.email; pushCloud(); }
    G.spent = ME.user.spent || 0;
  } catch (e) {}
}

// ---------------- Account page ----------------
async function openAccount(){
  if (!ME.user) { openAuth('login', 'Sign in to see your orders, codes and game.'); return; }
  try { const j = await api('/api/auth?action=me'); ME.user = j.user; ME.orders = j.orders || []; G.spent = ME.user.spent || 0; } catch (e) {}
  const u = ME.user;
  const rows = ME.orders.map(o => `<div class="acc-order"><div class="acc-o-top"><div><b>${o.order}</b><span>${new Date(o.created).toLocaleDateString()} · ${money(o.total)} · ${escapeHtml(o.status || 'Processing')}</span></div><button class="btn btn-ghost btn-sm" onclick="trackOrder('${o.order}','${escapeAttr(u.email)}')">Track</button></div>
    ${o.codes ? o.codes.map(c => `<div class="acc-code"><code>${c.code}</code><button class="link" onclick="useCode('${c.code}')">${G.used.includes(c.code) ? 'Redeemed' : 'Redeem'}</button></div>`).join('') : `<div class="acc-wait">Mundo XI codes arrive by email ${Date.now() < o.sendAt ? 'in a few minutes' : 'shortly'}.</div>`}</div>`).join('');
  $('#info-card').classList.add('wide');
  $('#info-modal-body').innerHTML = `<h3>${escapeHtml(u.name || 'My account')}</h3><p style="margin-bottom:8px">${escapeHtml(u.email)} ${u.verified ? '<span class="pill-ok">Confirmed</span>' : '<span class="pill-warn">Check your inbox to confirm</span>'}</p>
    <div class="score-rows" style="text-align:left;margin:10px 0 18px"><div><span>Spent in the shop</span><b>${money(u.spent || 0)}</b></div><div><span>Real Mundo XI players</span><b>${realCards().length}</b></div><div><span>Points</span><b>${G.points.toLocaleString()}</b></div><div><span>Gifts</span><b>${(u.spent || 0) >= SCARF_MIN ? 'Unlocked' : `Unlock at ${money(SCARF_MIN)}`}</b></div></div>
    <h4 class="acc-h">Orders</h4>${rows ? `<div class="acc-orders">${rows}</div>` : '<p>No orders yet. Every shirt comes with a 6-player Mundo XI pack.</p>'}
    <div class="acc-actions"><button class="info-btn" onclick="closeInfo();go('game','home')">Open Mundo XI</button><button class="info-btn" style="background:#f5f5f7;color:#1d1d1f" onclick="openTrack()">Track an order</button><button class="info-btn" style="background:#fff;color:#B3261E;border:1px solid #f0d0d0" onclick="signOut()">Sign out</button></div>`;
  $('#info-modal').classList.add('open');
}
function useCode(code){ closeInfo(); go('game', 'redeem'); $('#code-in').value = code; redeemCode(); }

// ---------------- Checkout needs an account ----------------
const _startStripe = startStripeCheckout;
startStripeCheckout = async function(){
  if (ME.ready && !ME.user) { closeCheckout(); openAuth('signup', 'Create your free account to check out. We send your Mundo XI codes and order updates to it.', () => { openCheckout(); setTimeout(() => startStripeCheckout(), 150); }); return; }
  return _startStripe();
};
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
  if (!G.orders.some(o => o.id === id)) { G.orders.unshift({id, order:j.order, total:j.total, at:Date.now(), email:j.email}); if (!ME.user) G.spent += j.spent; save(); }
  cart = []; renderCart(); loadMe();
  $('#conf-num').textContent = j.order;
  $('#conf-email').textContent = j.email || 'your email';
  $('#conf-summary').innerHTML = j.items.map(it => `<div class="cs-item"><div></div><div class="cs-item-info"><div>${escapeHtml(it.name)}</div><div class="meta">Qty ${it.q}</div></div><div>${money(it.amount)}</div></div>`).join('') +
    `<div class="cs-item" style="border-top:1px solid #d2d2d7;padding-top:12px;margin-top:8px;font-weight:600"><div></div><div class="cs-item-info">Total paid</div><div>${money(j.total)}</div></div>` +
    (j.scarf ? `<div class="scarf-ok" style="margin-top:12px">🧣 A free club scarf ships with this order</div>` : '');
  const packs = j.shirts;
  $('#conf-codes').innerHTML = j.codeCount ? `<div class="co-codes co-codes-wait"><div class="mail-ico">✉️</div><h3>Your Mundo XI codes are on the way</h3>
    <p>We're emailing <b>${j.codeCount} code${j.codeCount > 1 ? 's' : ''}</b> to <b>${escapeHtml(j.email)}</b> in about ${j.delayMin} minutes${packs ? `: ${packs} six-player pack${packs > 1 ? 's' : ''} (${packs * 6} players)` : ''}${j.scarf ? ' plus a bonus player from your free scarf' : ''}. They'll also appear in <b>My account</b>.</p>
    <button class="co-btn-primary" style="margin-top:10px" onclick="closeCheckout();go('game','home')">Explore Mundo XI while you wait</button></div>` : '';
}

// ---------------- Redeem, gifts (server-backed) ----------------
async function redeemCode(){
  const inp = $('#code-in'); const code = inp.value.trim().toUpperCase().replace(/\s/g, '');
  if (!/^MX-[PS][0-9A-Z]{3}-[A-Z2-9]{4}-[A-Z2-9]{8}$/.test(code)) { showToast('Codes look like MX-P014-AB2C-DE3F4G5H'); inp.focus(); return; }
  if (G.used.includes(code)) { showToast('That code has already been redeemed'); return; }
  if (ME.ready && !ME.user) { openAuth('login', 'Sign in to redeem your codes. They are linked to your account.', redeemCode); return; }
  const btn = inp.nextElementSibling; btn.disabled = true;
  try {
    const j = await api('/api/redeem', {method:'POST', body:{code}});
    inp.value = ''; showToast(applyCode(code, j)); objCheck(); renderGame(); gTab('redeem');
  } catch (e) { showToast(e.message); if (e.status === 409 && !G.used.includes(code)) { G.used.push(code); save(); } }
  btn.disabled = false;
}
async function claimGift(i){
  const g = GIFTS[i];
  if ((G.spent || 0) < SCARF_MIN) { openInfo('Gifts are locked', `Gifts unlock once you've spent $${SCARF_MIN} in the shop. You've spent $${(G.spent || 0).toFixed(2)} so far.`); return; }
  if (G.points < g.pts) { showToast(`You need ${(g.pts - G.points).toLocaleString()} more points`); return; }
  if (!ME.user) { openAuth('login', 'Sign in to claim gifts.', () => claimGift(i)); return; }
  try {
    const j = await api('/api/auth?action=gift', {method:'POST', body:{name:g.name}});
    G.points -= g.pts; G.gifts.push(`${g.name} · ${j.claim}`); save(); renderRewards();
    openInfo('Gift claimed', `Claim <b>${j.claim}</b> is in. We've emailed you to confirm the shipping address for your ${escapeHtml(g.name.toLowerCase())}.`);
  } catch (e) { showToast(e.message); }
}

// ---------------- FUT cards ----------------
const POS_LABELS = {GK:['GK'], DEF:['CB','CB','LB','RB'], MID:['CM','CAM','CDM','CM'], FWD:['ST','LW','RW','ST']};
function cardPos(c){ const l = POS_LABELS[c.pos] || ['CM']; return l[hash(c.id + 'p') % l.length]; }
function cardStats(c){
  const r = c.rating, h = n => (hash(c.id + n) % 11) - 5, cl = v => Math.max(18, Math.min(99, Math.round(v)));
  if (c.pos === 'GK') return [['DIV', r + 2], ['HAN', r], ['KIC', r - 10], ['REF', r + 3], ['SPD', r - 24], ['POS', r]].map(([k, v], i) => [k, cl(v + h(i))]);
  const w = {FWD:[4, 3, -6, 2, -34, -4], MID:[-3, -6, 3, 2, -14, -4], DEF:[-6, -30, -10, -12, 3, 2]}[c.pos] || [0, 0, 0, 0, 0, 0];
  return ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map((k, i) => [k, cl(r + w[i] + h(i))]);
}
function crest(team){
  const t = String(team || 'FC'), hue = hash(t) % 360;
  const ab = t.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'FC';
  return `<span class="fut-crest" style="--h:${hue}">${ab}</span>`;
}
function cardHTML(c){
  if (c.item) return `<div class="pcx fut r-item"><div class="fut-in"><div class="fut-top"><b class="fut-rt">+1</b><span class="fut-pos">CHEM</span></div>
    <div class="fut-img fut-emoji">${c.emoji || '🧣'}</div><div class="fut-name">${escapeHtml(c.name)}</div><div class="fut-desc">${escapeHtml(c.desc || '')}</div><div class="fut-tag">Club item</div></div></div>`;
  const r = rarityOf(c), k = c.noob ? 'noob' : r.k;
  return `<div class="pcx fut r-${k}${c.demo ? ' demo' : ''}" title="${escapeAttr(c.player)} · ${c.demo ? 'Demo player' : r.label}">
    ${c.demo ? '<div class="demo-tag">DEMO</div>' : ''}<div class="fut-in">
    <div class="fut-top"><b class="fut-rt">${c.rating}</b><span class="fut-pos">${cardPos(c)}</span>${crest(c.team)}</div>
    <div class="fut-img"><img src="${c.img}" alt="" loading="lazy"></div>
    <div class="fut-name">${escapeHtml(shortName(c.player))}</div>
    <div class="fut-stats">${cardStats(c).map(([k, v]) => `<span><b>${v}</b>${k}</span>`).join('')}</div>
    <div class="fut-tag">${c.demo ? 'Demo' : c.noob ? 'Rookie' : r.label}</div></div></div>`;
}

// scarf item adds chemistry
const _teamScore = teamScore;
teamScore = function(){ const s = _teamScore(); if (G.items.some(i => i.key === 'scarf') && s.xi.length) { s.chem = Math.min(7, s.chem + 2); s.total = Math.round((s.base + s.chem * .5) * 10) / 10; } return s; };

// ---------------- Objectives ----------------
const OBJECTIVES = [
  {k:'account', t:'Create your manager account', r:'Welcome pack', done:() => !!ME.user || G.welcomeOpened},
  {k:'welcome', t:'Open your Welcome pack', r:'Rookie + club scarf', done:() => !!G.welcomeOpened},
  {k:'demoxi', t:'Build a full demo XI', r:'Daily demo pack', done:() => squadFull()},
  {k:'code', t:'Redeem your first shirt code', r:'+300 points', pts:300, done:() => G.used.length > 0},
  {k:'real6', t:'Sign 6 real players', r:'+200 points', pts:200, done:() => realCards().length >= 6},
  {k:'real11', t:'Field 11 real players', r:'+500 points', pts:500, done:() => canPlay()},
  {k:'match1', t:'Play your first match', r:'+300 points', pts:300, done:() => (G.matches || 0) >= 1},
  {k:'win3', t:'Win 3 matches', r:'+600 points', pts:600, done:() => (G.wins || 0) >= 3},
  {k:'cup', t:'Win a cup', r:'+1,000 points', pts:1000, done:() => G.trophies.some(t => /Cup winner/.test(t))},
  {k:'div8', t:'Reach Division 8', r:'+1,500 points', pts:1500, done:() => (G.career?.div || 10) <= 8},
];
function objCheck(){
  let n = 0;
  OBJECTIVES.forEach(o => { if (!G.obj[o.k] && o.done()) { G.obj[o.k] = Date.now(); if (o.pts) { G.points += o.pts; n++; showToast(`Objective complete: ${o.t} · ${o.r}`); } } });
  if (n) save();
}
const _endMatch = endMatch;
endMatch = function(){ _endMatch(); if (M && M.result) { G.matches = (G.matches || 0) + 1; if (M.result.win) G.wins = (G.wins || 0) + 1; save(); objCheck(); } };

// ---------------- Daily demo pack ----------------
const dayKey = () => new Date().toISOString().slice(0, 10);
function dailyReady(){ return G.daily !== dayKey(); }
function claimDaily(){
  if (!dailyReady()) { showToast('Come back tomorrow for another daily pack'); return; }
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  G.streak = G.daily === y ? (G.streak || 0) + 1 : 1; G.daily = dayKey();
  const cards = [0, 1, 2].map(() => { const c = randomCard({lo:70, hi:90, skew:1.1}); c.demo = true; return c; });
  cards.forEach(c => G.cards.push(c));
  save(); showPackReveal('Daily demo pack', 'p-demo', cards, `Day ${G.streak} streak · demo players are for squad building only`);
}

// ---------------- Pack reveal (FUT style) ----------------
function showPackReveal(title, cls, cards, note, after){
  const best = cards.filter(c => !c.item).sort((a, b) => b.rating - a.rating)[0];
  const tier = best ? (best.noob ? 'bronze' : rarityOf(best).k) : 'item';
  PO = {type:'custom', cards, bonus:0, shown:0, note, after};
  $('#pack-ov').classList.add('open'); $('#pack-ov').dataset.tier = tier; document.body.style.overflow = 'hidden';
  $('#po-inner').innerHTML = `<div class="po-title">${escapeHtml(title)}</div>
    <div class="po-pack" id="po-pack" onclick="burstCustom()" role="button" tabindex="0" aria-label="Open pack"><div class="packart ${cls}"><i>${escapeHtml(title.replace(/ pack$/i, ''))}<small>${cards.length} card${cards.length > 1 ? 's' : ''}</small></i></div><div class="po-hint">Tap to open</div></div>`;
}
function burstCustom(){
  const el = $('#po-pack'); if (!el || el.classList.contains('shake')) return;
  el.classList.add('shake');
  setTimeout(() => {
    $('#po-inner').innerHTML = `<div class="po-title">${PO.note ? '' : 'Your cards'}</div>
      <div class="po-cards">${PO.cards.map((c, i) => `<div class="flip" id="flip-${i}"><div class="fi"><div class="back"></div><div class="front">${cardHTML(c)}</div></div></div>`).join('')}</div>
      ${PO.note ? `<p class="po-note">${escapeHtml(PO.note)}</p>` : ''}<div class="po-actions" id="po-actions"></div>`;
    let i = 0; const next = () => { if (i >= PO.cards.length) return customDone(); $('#flip-' + i).classList.add('on'); i++; setTimeout(next, 420); }; next();
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 950);
}
function customDone(){
  const after = PO.after;
  $('#po-actions').innerHTML = after ? `<button class="btn btn-gold" onclick="closePack();(${after})()">Continue</button>` : `<button class="btn btn-gold" onclick="closePack('squad')">Go to my squad</button><button class="btn btn-ghost" onclick="closePack()">Done</button>`;
}

// ---------------- Welcome pack & tutorial ----------------
async function grantWelcome(){
  if (G.welcomeOpened) return true;
  if (ME.ready) {
    if (!ME.user) return false;
    try { const j = await api('/api/auth?action=welcome', {method:'POST'}); if (!j.granted && G.welcomeOpened) return true; } catch (e) { showToast(e.message); return false; }
  }
  const rookie = randomCard({lo:40, hi:47, skew:1}); rookie.noob = true;
  const scarf = {item:true, key:'scarf', id:newId(), name:'Club scarf', emoji:'🧣', desc:'+1 chemistry for your XI'};
  G.cards.push(rookie); G.items.push(scarf); G.welcomeOpened = Date.now();
  save(); objCheck();
  showPackReveal('Welcome pack', 'p-welcome', [rookie, scarf], 'Your first real player and your club scarf', 'tutStep4');
  return true;
}
const TUT = [
  () => tutPanel(1, 'Welcome to Mundo XI, manager', `Collect real players, build your starting XI and climb from Division 10 to Division 1 for the grand prize. Here's how it works.`, `<button class="btn btn-gold" onclick="tutGo(2)">Let's go</button>`),
  () => ME.user || (!ME.ready && false) ? tutGo(3) : tutPanel(2, 'Claim your Welcome pack', `Create your free manager account to claim it. You'll use the same account to check out, and we email your player codes to it.`,
      ME.ready ? `<button class="btn btn-gold" onclick="tutClose();openAuth('signup','Create your account to claim your Welcome pack.', () => tutGo(3))">Create account</button><button class="btn btn-ghost" onclick="tutClose();openAuth('login','Sign in to claim your Welcome pack.', () => tutGo(3))">I have an account</button>`
        : `<button class="btn btn-gold" onclick="tutGo(3)">Claim my Welcome pack</button>`),
  () => tutPanel(3, 'Your Welcome pack is ready', 'Inside: your first real player and a club scarf that boosts your team chemistry. Tap the pack to open it.', `<button class="btn btn-gold" onclick="tutClose();grantWelcome().then(ok => { if (!ok) tutGo(2); })">Open Welcome pack</button>`),
];
function tutStep4(){ G.tut = 4; save(); gTab('squad'); tutPanel(4, 'Meet your squad', `You have <b>${realCards().length} real player${realCards().length === 1 ? '' : 's'}</b>. The gray <b>DEMO</b> players fill your XI so you can try things out, but <b>matches and cups need 11 real players</b>.`, `<button class="btn btn-gold" onclick="tutGo(5)">How do I get players?</button>`); }
function tutStep5(){ tutPanel(5, 'Every shirt = a 6-player pack', `<ul class="tut-list"><li>👕 <b>Every jersey</b> comes with 4,000 points: one 6-player Gold pack, emailed to you a few minutes after you buy.</li><li>🧣 <b>Orders over $30</b> add a real club scarf and a bonus player.</li><li>⚽ Your rookie + 1 shirt = 7 players. <b>One more shirt and you're on the pitch.</b></li></ul>`, `<button class="btn btn-gold" onclick="tutDone();go('shop')">Shop jerseys</button><button class="btn btn-ghost" onclick="tutDone();gTab('home')">Explore Mundo XI</button>`); }
function tutGo(n){ G.tut = n; save(); if (n === 4) return tutStep4(); if (n === 5) return tutStep5(); TUT[n - 1](); }
function tutDone(){ G.tut = 99; save(); tutClose(); }
function tutClose(){ $('#tut')?.remove(); }
function tutPanel(n, title, body, btns){
  tutClose();
  document.body.insertAdjacentHTML('beforeend', `<div class="tut" id="tut" role="dialog" aria-modal="true"><div class="tut-card"><div class="tut-step">Step ${Math.min(n, 5)} of 5</div><div class="tut-coach">🧑‍💼</div><h2>${title}</h2><div class="tut-body">${body}</div><div class="tut-btns">${btns}</div>${n < 5 ? '<button class="tut-skip" onclick="tutDone()">Skip tutorial</button>' : ''}</div></div>`);
}
function maybeTutorial(){
  if (G.tut >= 99) return;
  if (!G.welcomeOpened) return tutGo(G.tut >= 2 ? (ME.user ? 3 : 2) : 1);
  if (G.tut < 5) return tutGo(G.tut === 4 ? 4 : 5);
}

// ---------------- Hub (FUT home) ----------------
function renderHome(){
  objCheck();
  const C = career(), s = teamScore(), real = realCards().length, pct = Math.min(100, real / 11 * 100);
  const next = OBJECTIVES.filter(o => !G.obj[o.k]).slice(0, 3);
  const doneN = OBJECTIVES.filter(o => G.obj[o.k]).length;
  $('#home-main').innerHTML = `<div class="hub">
    <button class="hub-tile hub-big hub-season" onclick="gTab('play')"><span class="ht-k">Division Rivals</span><b>Division ${C.div}</b><span>Season ${C.season} · Matchday ${Math.min(C.round + 1, SEASON_TEAMS - 1)} of ${SEASON_TEAMS - 1}</span><em>${canPlay() ? 'Play next match' : 'Locked: needs 11 real players'}</em></button>
    <button class="hub-tile hub-squad" onclick="gTab('squad')"><span class="ht-k">My squad</span><b>${s.xi.length ? s.total.toFixed(1) : '–'}</b><span>Team rating</span><div class="hub-meter"><i style="width:${pct}%"></i></div><em>${real}/11 real players</em></button>
    <button class="hub-tile hub-store" onclick="gTab('packs')"><span class="ht-k">Store</span><b>${G.points.toLocaleString()}</b><span>points</span><em>${G.points >= PACK_TYPES.gold.price ? 'You can open a 6-player pack!' : 'Every shirt = 1 Gold pack'}</em></button>
    <button class="hub-tile hub-shop" onclick="go('shop')"><span class="ht-k">Get players</span><b>Shop jerseys</b><span>Every shirt brings a 6-player pack</span><em>Orders over $30: free scarf + bonus player</em></button>
    <button class="hub-tile hub-cups" onclick="gTab('cups')"><span class="ht-k">Live cups</span><b>${CUPS.length} cups</b><span>Kick off every few minutes</span><em>${canPlay() ? 'Enter now' : 'Locked'}</em></button>
    <button class="hub-tile hub-daily${dailyReady() ? ' ready' : ''}" onclick="claimDaily()"><span class="ht-k">Daily pack</span><b>${dailyReady() ? 'Ready!' : 'Claimed'}</b><span>3 demo players${G.streak ? ` · ${G.streak}-day streak` : ''}</span><em>${dailyReady() ? 'Tap to open' : 'Back tomorrow'}</em></button>
    <div class="hub-tile hub-obj"><span class="ht-k">Objectives · ${doneN}/${OBJECTIVES.length}</span>${next.map(o => `<div class="obj"><i></i><div><b>${o.t}</b><span>${o.r}</span></div></div>`).join('') || '<b>All done. Legend!</b>'}<button class="link" onclick="openObjectives()">See all</button></div>
    <button class="hub-tile hub-market" onclick="gTab('market')"><span class="ht-k">Transfer market</span><b>${(G.listings || []).length || 8} listings</b><span>Trade cards with other fans</span></button>
    <button class="hub-tile hub-club" onclick="gTab('collection')"><span class="ht-k">Club</span><b>${G.cards.length}</b><span>cards · ${G.items.length} item${G.items.length === 1 ? '' : 's'}</span></button>
  </div>`;
}
function openObjectives(){
  $('#info-card').classList.add('wide');
  $('#info-modal-body').innerHTML = `<h3>Objectives</h3><div class="obj-list">${OBJECTIVES.map(o => `<div class="obj${G.obj[o.k] ? ' done' : ''}"><i></i><div><b>${o.t}</b><span>${o.r}</span></div></div>`).join('')}</div><button class="info-btn" onclick="closeInfo()">Close</button>`;
  $('#info-modal').classList.add('open');
}

// ---------------- Tabs & game entry ----------------
function gTab(t){
  t = TAB_ALIASES[t] || t;
  gCurrent = t;
  $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  $$('.panel').forEach(p => p.classList.toggle('on', p.dataset.panel === t));
  ({home:renderHome, play:renderSeason, squad:renderSquad, collection:renderCollection, market:renderMarket, rewards:renderRewards, cups:renderCups, packs:renderPacks, redeem:()=>{}})[t]?.();
  if (currentView === 'game' && location.hash !== '#game/' + t) history.replaceState(null, '', '#game/' + t);
}
function renderGame(){
  seedDemo(); career(); updateStats(); gTab(gCurrent); objCheck();
  const club = $('#g-club'); if (club) club.textContent = ME.user ? `${ME.user.name || ME.user.email.split('@')[0]} FC` : 'Your club';
  setTimeout(() => maybeTutorial(), 250);
}
gCurrent = 'home';
const _renderCollection = renderCollection;
renderCollection = function(){ _renderCollection(); if (G.items.length) $('#collection').insertAdjacentHTML('afterbegin', `<h3 class="h3" style="font-size:24px">Club items</h3><div class="col-grid" style="margin-bottom:28px">${G.items.map(i => `<div class="col-item">${cardHTML(i)}</div>`).join('')}</div>`); };

// ---------------- Init ----------------
(function(){
  const gh = $('.g-hero'); if (gh && !$('#demo-banner')) gh.insertAdjacentHTML('afterend', '<div id="demo-banner" class="demo-banner hidden"></div>');
  const tabs = $('.tabs'); if (tabs && !tabs.querySelector('[data-tab="home"]')) tabs.insertAdjacentHTML('afterbegin', '<button class="tab" data-tab="home" onclick="gTab(\'home\')">Home</button>');
  const body = $('.g-body'); if (body && !body.querySelector('[data-panel="home"]')) body.insertAdjacentHTML('afterbegin', '<div class="panel" data-panel="home"><div id="home-main"></div></div>');
  const h1 = $('.g-top h1'); if (h1 && !$('#g-club')) h1.insertAdjacentHTML('beforebegin', '<div class="g-club" id="g-club">Your club</div>');
})();
cart = store.get('fm_cart', []);
renderCart();
updateWishCount();
renderHero(); renderPicks(); renderBest(); renderRetro(); renderBoxes(); renderLeagueTiles(); renderPrize();
checkCups();
routeFromHash();
if (location.hash === '#bag' && cart.length) setTimeout(toggleCart, 200);
if (location.hash === '#account') setTimeout(openAccount, 600);
if (location.hash === '#verified') showToast('Email confirmed. Thanks!');
const _rt = /#reset=([\w-]+)/.exec(location.hash); if (_rt) { history.replaceState(null, '', '/#home'); setTimeout(() => openReset(_rt[1]), 300); }
(function(){ const id = new URLSearchParams(location.search).get('order'); if (id) handleOrderReturn(id); })();
loadMe();
