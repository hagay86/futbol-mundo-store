// =====================================================================
// FUTBOL MUNDO v19 — hide empty categories (curated catalogue).
// =====================================================================
function catCount(c){ return c === 'All' ? PRODUCTS.length : PRODUCTS.filter(p => p.c === c).length; }
const _renderShop19 = renderShop;
renderShop = function(){
  _renderShop19();
  document.querySelectorAll('#cat-chips .chip').forEach(b => { const m = (b.getAttribute('onclick') || '').match(/shopState\.cat='([^']+)'/); if (m && m[1] !== 'All' && !catCount(m[1])) b.style.display = 'none'; });
};
function hideEmptyNav(){
  document.querySelectorAll('a[onclick*="goCat("]').forEach(a => { const m = (a.getAttribute('onclick') || '').match(/goCat\('([^']+)'/); if (m && !catCount(m[1])) a.style.display = 'none'; });
  const rc = document.getElementById('retro-count'); if (rc && !PRODUCTS.some(p => p.c === 'Retro')) { const sec = rc.closest('section'); if (sec) sec.style.display = 'none'; }
}
hideEmptyNav();
// drop bag items that are no longer sold
try { const names = new Set(PRODUCTS.map(p => p.n)); const before = cart.length; cart = cart.filter(c => c.box || c.pack || names.has(c.n)); if (cart.length !== before) renderCart(); } catch (e) {}
