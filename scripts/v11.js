// =====================================================================
// FUTBOL MUNDO v11 — product pages copy the partner store's real options:
// sizes, name & number (player list, custom, or none), patches, ads,
// photo gallery. Add-on prices are marked up like the shirts (×1.8).
// =====================================================================
const CUSTOM_NAME_FEE = Math.round(2.93 * 1.8 * 100) / 100;
let pdpOpts = {}, pdpBase = 0;
const isCustomOpt = v => /^custom/i.test(v || '');
function pdpAddons(p){
  if (p && p.opt) return p.opt.reduce((s, [label, set]) => { const o = set.find(x => x[0] === pdpOpts[label]); return s + (o ? o[1] : 0); }, 0);
  return $('#pdp-cname').value.trim() ? CUSTOM_NAME_FEE : 0;
}
function pdpPrice(){ return Math.round((pdpBase + pdpAddons(pdpProduct)) * 100) / 100; }
function pdpRefreshPrice(){ $('#pdp-price').textContent = money(pdpPrice()); }
function pdpCustomVisible(show){ const s = $('#pdp-cname')?.closest('.pdp-section'); if (s) s.classList.toggle('hidden', !show); }
function pickOpt(btn, label){
  pdpOpts[label] = btn.dataset.v;
  btn.parentElement.querySelectorAll('.op').forEach(b => b.classList.toggle('sel', b === btn));
  const sel = btn.parentElement.parentElement.querySelector('.op-val'); if (sel) sel.textContent = btn.dataset.v;
  if (label === 'Name and Number') { pdpCustomVisible(isCustomOpt(btn.dataset.v)); if (!isCustomOpt(btn.dataset.v)) { $('#pdp-cname').value = ''; $('#pdp-cnum').value = ''; } }
  pdpRefreshPrice();
}
function optHTML(label, set){
  const isImg = set.some(o => o[2]);
  const btns = set.map((o, i) => `<button type="button" class="op${isImg ? ' op-img' : ''}${i === 0 ? ' sel' : ''}" data-v="${escapeAttr(o[0])}" onclick="pickOpt(this, '${escapeAttr(label)}')">${o[2] ? `<img src="${escapeAttr(o[2])}?x-oss-process=image/resize,m_lfit,w_160,h_160" alt="" loading="lazy">` : ''}<span class="op-n">${escapeHtml(o[0])}</span>${o[1] ? `<span class="op-p">+${money(o[1])}</span>` : ''}</button>`).join('');
  return `<div class="pdp-section pdp-opt"><div class="pdp-label">${escapeHtml(label)} <span class="op-val notranslate">${escapeHtml(set[0][0])}</span></div><div class="op-grid">${btns}</div></div>`;
}
const _openP11 = openP;
openP = function(id){
  _openP11(id);
  const p = PRODUCTS[id]; if (!p) return;
  pdpOpts = {}; pdpBase = +p.p;
  $('#player-section').style.display = 'none';           // old printed-name lists were not reliable
  document.querySelectorAll('#pdp-overlay .pdp-opt').forEach(e => e.remove());
  // Gallery
  let th = $('#pdp-thumbs');
  if (!th) { $('.pdp-gallery').insertAdjacentHTML('beforeend', '<div class="pdp-thumbs" id="pdp-thumbs"></div>'); th = $('#pdp-thumbs'); }
  const gal = (p.gal && p.gal.length ? p.gal : [p.i]).slice(0, 6);
  th.innerHTML = gal.length > 1 ? gal.map((g, i) => `<button type="button" class="${i ? '' : 'sel'}" onclick="pdpShow(this, '${escapeAttr(g)}')"><img src="${escapeAttr(g)}?x-oss-process=image/resize,m_lfit,w_140,h_140" alt="" loading="lazy"></button>`).join('') : '';
  // Sizes exactly as the supplier lists them
  if (p.sz && p.sz.length) $('#pdp-sizes').innerHTML = p.sz.map(s => `<button class="sz" onclick="selSize(this,'${escapeAttr(s)}')">${escapeHtml(s)}</button>`).join('');
  const nameSec = $('#pdp-cname').closest('.pdp-section');
  const note = nameSec.querySelector('.custom-note');
  if (p.opt) {
    const anchor = nameSec;
    p.opt.forEach(([label, set]) => { pdpOpts[label] = set[0][0]; anchor.insertAdjacentHTML('beforebegin', optHTML(label, set)); });
    const nn = p.opt.find(o => o[0] === 'Name and Number');
    pdpCustomVisible(nn ? isCustomOpt(nn[1][0][0]) : false);
    if (note) note.textContent = 'Type the name and number to print. Printing adds 2–3 days.';
  } else {
    pdpCustomVisible(!!p.shirt);
    if (note) note.textContent = `Leave blank for a plain shirt. Name and number printing +${money(CUSTOM_NAME_FEE)}.`;
  }
  pdpRefreshPrice();
};
function pdpShow(btn, src){ $('#pdp-img').src = src; btn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b === btn)); }
document.addEventListener('input', e => { if (e.target && e.target.id === 'pdp-cname' && pdpProduct && !pdpProduct.opt) pdpRefreshPrice(); });

const _pdpItem11 = pdpItem;
pdpItem = function(){
  const p = pdpProduct;
  const nn = p && p.opt && pdpOpts['Name and Number'];
  if (nn && isCustomOpt(nn) && !$('#pdp-cname').value.trim()) { showToast('Type the name to print, or pick another option'); return null; }
  const it = _pdpItem11(); if (!it) return null;
  it.p = pdpPrice();
  if (p && p.opt) {
    it.opts = Object.assign({}, pdpOpts);
    if (!isCustomOpt(nn)) { it.cname = ''; it.cnum = ''; }
    it.ox = Object.entries(it.opts).filter(([, v]) => !/^no\b/i.test(v) && !isCustomOpt(v)).map(([k, v]) => v).join(' · ');
  }
  return it;
};
const _addToCart11 = addToCart;
addToCart = function(item){
  const key = JSON.stringify(item.opts || {});
  const ex = cart.find(c => c.n === item.n && c.sz === item.sz && c.cname === item.cname && c.cnum === item.cnum && JSON.stringify(c.opts || {}) === key && c.p === item.p);
  if (ex) { ex.q += item.q; renderCart(); return; }
  cart.push(Object.assign({}, item)); renderCart();
};
