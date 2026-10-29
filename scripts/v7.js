// =====================================================================
// FUTBOL MUNDO v7 — automatic language by country + Mundo XI landing page
// =====================================================================
const LANGS = {en:'English', es:'Español', pt:'Português', fr:'Français', de:'Deutsch', it:'Italiano', he:'עברית', ar:'العربية'};
const COUNTRY_LANG = {
  ES:'es',MX:'es',AR:'es',CO:'es',CL:'es',PE:'es',VE:'es',EC:'es',GT:'es',CU:'es',BO:'es',DO:'es',HN:'es',PY:'es',SV:'es',NI:'es',CR:'es',PA:'es',UY:'es',PR:'es',GQ:'es',
  PT:'pt',BR:'pt',AO:'pt',MZ:'pt',CV:'pt',
  FR:'fr',BE:'fr',LU:'fr',MC:'fr',SN:'fr',CI:'fr',CM:'fr',MA:'fr',DZ:'fr',TN:'fr',HT:'fr',
  DE:'de',AT:'de',CH:'de',LI:'de',
  IT:'it',SM:'it',VA:'it',
  IL:'he',
  SA:'ar',AE:'ar',QA:'ar',KW:'ar',BH:'ar',OM:'ar',JO:'ar',EG:'ar',LB:'ar',IQ:'ar',SY:'ar',YE:'ar',LY:'ar',PS:'ar',SD:'ar',
};
const I18N = {lang:'en', dict:null, skip:'script,style,textarea,code,.pcx,#team-chips,.chip .ct,[translate="no"],.notranslate,.fut-name,.fut-crest,.fut-pos,.pcard .name,.pcard .team,.pdp-name,.pdp-league,.ci-name,.co-line-name,.co-sum-item-name,.cs-item-info>div:first-child,.mo-team,.co-code b,.acc-code code,.brand,.co-header-logo,.wo-line,.stage-tag .t,.listing .who,.res span:nth-child(2),.board-row span:nth-child(2),.bteam span,#mo-home,#mo-away,.mc'};
window.__i18nCollect = window.__i18nCollect || null;
const I18N_NUM = /\d(?:[\d,.:]*\d)?/g;
function i18nKey(t){ const nums = []; const key = t.replace(I18N_NUM, m => { nums.push(m); return '{' + (nums.length - 1) + '}'; }); return [key, nums]; }
function i18nLookup(raw){
  const t = raw.replace(/\s+/g, ' ').trim();
  if (!t || !/[A-Za-z]{2}/.test(t)) return null;
  const [key, nums] = i18nKey(t);
  if (window.__i18nCollect) window.__i18nCollect.add(key);
  const tr = I18N.dict && I18N.dict[key];
  if (!tr) return null;
  const out = tr.replace(/\{(\d+)\}/g, (_, i) => nums[i] ?? '');
  const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
  return lead + out + trail;
}
function i18nText(node){
  if (node.__i18n === I18N.lang) return;
  const p = node.parentElement; if (!p || p.closest(I18N.skip)) return;
  if (node.__en === undefined || (node.__i18nOut !== undefined && node.nodeValue !== node.__i18nOut)) node.__en = node.nodeValue;
  const tr = I18N.lang === 'en' ? null : i18nLookup(node.__en);
  const val = tr ?? node.__en;
  node.__i18n = I18N.lang; node.__i18nOut = val;
  if (node.nodeValue !== val) node.nodeValue = val;
}
function i18nAttrs(el){
  if (el.closest(I18N.skip)) return;
  for (const a of ['placeholder', 'aria-label', 'title']) {
    if (!el.hasAttribute(a)) continue;
    const k = '__en_' + a;
    if (el[k] === undefined || el.getAttribute(a) !== el[k + 'Out']) el[k] = el.getAttribute(a);
    const v = I18N.lang === 'en' ? el[k] : (i18nLookup(el[k]) ?? el[k]);
    el[k + 'Out'] = v; if (el.getAttribute(a) !== v) el.setAttribute(a, v);
  }
}
function i18nScan(root){
  if (!root) return;
  if (root.nodeType === 3) return i18nText(root);
  if (root.nodeType !== 1) return;
  if (root.matches && root.matches('script,style')) return;
  i18nAttrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n; while ((n = w.nextNode())) { if (n.nodeType === 3) i18nText(n); else if (n.hasAttribute && (n.hasAttribute('placeholder') || n.hasAttribute('aria-label') || n.hasAttribute('title'))) i18nAttrs(n); }
}
let I18N_BUSY = false;
const i18nObs = new MutationObserver(ms => {
  if (I18N_BUSY) return; I18N_BUSY = true;
  try { ms.forEach(m => { if (m.type === 'characterData') { m.target.__i18n = null; i18nText(m.target); } else m.addedNodes.forEach(i18nScan); }); } finally { I18N_BUSY = false; }
});
async function setLang(lang, remember){
  if (!LANGS[lang]) lang = 'en';
  if (remember) { try { localStorage.setItem('fm_lang', lang); } catch (e) {} }
  if (lang !== 'en') {
    try { const r = await fetch('/i18n/' + lang + '.json', {cache:'force-cache'}); I18N.dict = await r.json(); } catch (e) { lang = 'en'; I18N.dict = null; }
  } else I18N.dict = null;
  I18N.lang = lang;
  const rtl = lang === 'he' || lang === 'ar';
  document.documentElement.lang = lang; document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('rtl', rtl);
  if (!I18N.titleEn) I18N.titleEn = document.title;
  document.title = lang === 'en' ? I18N.titleEn : (i18nLookup(I18N.titleEn) || I18N.titleEn);
  I18N_BUSY = true; try { i18nScan(document.body); } finally { I18N_BUSY = false; }
  document.documentElement.classList.remove('i18n-wait');
  $$('.lang-sel').forEach(s => s.value = lang);
}
async function detectLang(){
  let saved = null; try { saved = localStorage.getItem('fm_lang'); } catch (e) {}
  if (saved) return saved;
  let auto = null; try { auto = sessionStorage.getItem('fm_lang_auto'); } catch (e) {}
  if (!auto) {
    try { const j = await (await fetch('/api/geo')).json(); auto = COUNTRY_LANG[j.country] || ''; } catch (e) {}
    if (!auto) { const n = (navigator.language || 'en').slice(0, 2).toLowerCase(); auto = LANGS[n] ? n : (n === 'iw' ? 'he' : 'en'); }
    try { sessionStorage.setItem('fm_lang_auto', auto); } catch (e) {}
  }
  return auto;
}
function langSelectHTML(){ return `<label class="lang-pick" translate="no"><span aria-hidden="true">🌐</span><select class="lang-sel" aria-label="Language" onchange="setLang(this.value,true)">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>`; }

// ---------------- Mundo XI landing ----------------
function xiEntered(){ try { return sessionStorage.getItem('fm_xi_in') === '1'; } catch (e) { return true; } }
let XI_NEXT = null;
const _go = go;
go = function(view, anchor, push = true){
  if (view === 'game' && !xiEntered()) { XI_NEXT = anchor || null; return _go('xi', null, push); }
  return _go(view, anchor, push);
};
function enterXI(){ try { sessionStorage.setItem('fm_xi_in', '1'); } catch (e) {} go('game', XI_NEXT); XI_NEXT = null; }
function renderXILanding(){
  const sample = shuffle(PICK_POOL.filter(p => getPlayersForProduct(p.n).length)).slice(0, 3);
  const tiers = [{lo:76, hi:84}, {lo:88, hi:91}, {lo:66, hi:74}];
  const cards = sample.map((p, i) => { const r = getPlayersForProduct(p.n); const [num, player] = r[hash(p.n + i) % r.length]; return cardHTML(makeCard({player, num, team:p.t || p.g, img:p.i, rating:tiers[i].lo + hash(p.n) % (tiers[i].hi - tiers[i].lo), seed:'xi' + i})); });
  $('#xi-cards').innerHTML = cards.join('');
}
const _routeFromHash = routeFromHash;
routeFromHash = function(){ if (location.hash.startsWith('#xi')) return _go('xi', null, false); return _routeFromHash(); };

// ---------------- Init ----------------
(function(){
  // landing view
  const main = document.querySelector('main');
  main.insertAdjacentHTML('afterbegin', `<div class="view hidden" id="view-xi">
    <section class="xi-hero"><div class="wrap xi-hero-in">
      <div class="xi-copy">
        <div class="xi-kicker">Futbol Mundo presents</div>
        <h1 class="xi-title">MUNDO XI</h1>
        <p class="xi-tag">Your shirts. Your squad. Your league.</p>
        <p class="xi-sub">Every jersey you buy comes with a 6-player pack. Build your eleven, climb ten divisions and play for the grand prize.</p>
        <div class="xi-ctas"><button class="btn btn-gold xi-enter" onclick="enterXI()">Enter Mundo XI</button><button class="btn btn-ghost" onclick="go('shop')">Shop jerseys</button></div>
        <div class="xi-free">Free to join · Welcome pack on sign-up</div>
      </div>
      <div class="xi-cards" id="xi-cards"></div>
    </div></section>
    <section class="xi-steps"><div class="wrap">
      <div class="xi-step"><b>01</b><h3>Buy a shirt</h3><p>Every jersey brings Ɱ4,000 Mundo Credits: one 6-player Gold pack, emailed to you minutes after you order.</p></div>
      <div class="xi-step"><b>02</b><h3>Open your packs</h3><p>Bronze to Icon. Big signings arrive with a walkout. Orders over $30 add a free club scarf and a bonus player.</p></div>
      <div class="xi-step"><b>03</b><h3>Build your eleven</h3><p>Try squad building with demo players. With 11 real players you're on the pitch.</p></div>
      <div class="xi-step"><b>04</b><h3>Climb and win</h3><p>Ten divisions, live cups every few minutes, and a trip for two to a top-flight match for the Division 1 champions.</p></div>
    </div></section>
    <section class="xi-final"><div class="wrap"><h2>Ready, manager?</h2><button class="btn btn-gold xi-enter" onclick="enterXI()">Enter Mundo XI</button></div></section>
  </div>`);
  // language pickers: footer + mobile menu
  document.querySelector('.f-bot')?.insertAdjacentHTML('beforeend', langSelectHTML());
  document.querySelector('#mnav')?.insertAdjacentHTML('beforeend', langSelectHTML());
  document.querySelector('.notice')?.insertAdjacentHTML('beforeend', langSelectHTML());
})();
// render landing when shown
const _go2 = go;
go = function(view, anchor, push = true){ const r = _go2(view, anchor, push); if (currentView === 'xi') { renderXILanding(); $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === 'game')); } return r; };
const _maybeTut = maybeTutorial;
maybeTutorial = function(){ if (currentView === 'game') _maybeTut(); };
i18nObs.observe(document.body, {childList:true, subtree:true, characterData:true});
detectLang().then(l => setLang(l, false));
if (currentView === 'game' && !xiEntered() && !new URLSearchParams(location.search).get('order')) { XI_NEXT = gCurrent; _go('xi', null, false); renderXILanding(); }
