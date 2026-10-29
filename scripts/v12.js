// =====================================================================
// FUTBOL MUNDO v12 — rotating shop banner at the top of the home page
// (like the partner store's slider), built from our own product photos.
// =====================================================================
const SLIDES = [
  {k:'wc',   t:'World Cup 2026', s:'Every nation’s home and away kits', c:'#0F1E33', a:'#E8B730', f:p => p.c === 'World Cup 2026', go:() => goCat('World Cup 2026')},
  {k:'new',  t:'New season 26/27', s:'Fresh kits from every big club', c:'#17804F', a:'#fff', f:p => /26\/27/.test(p.n) && !/kid|women|player/i.test(p.n), go:() => shopSearch('26/27')},
  {k:'rm',   t:'Real Madrid', s:'Home, away and third 26/27', c:'#1B2B5A', a:'#E8B730', f:p => /real madrid/i.test(p.n) && /26\/27/.test(p.n) && !/kid|women/i.test(p.n), go:() => shopSearch('real madrid')},
  {k:'fcb',  t:'Barcelona', s:'Blaugrana kits for the new season', c:'#7A1734', a:'#F2C230', f:p => /barcelona/i.test(p.n) && /26\/27/.test(p.n) && !/kid|women/i.test(p.n), go:() => shopSearch('barcelona')},
  {k:'epl',  t:'Premier League', s:'All 20 clubs, all the new kits', c:'#3D195B', a:'#00FF85', f:p => p.c === 'Premier League' && /26\/27/.test(p.n) && !/kid|women/i.test(p.n), go:() => goCat('Premier League')},
  {k:'retro',t:'Retro classics', s:'Legendary shirts from the 70s to the 2010s', c:'#2B2118', a:'#E8B730', f:p => p.c === 'Retro' && p.shirt && !/kid/i.test(p.n), go:() => goCat('Retro')},
];
function shopSearch(q){ shopState.cat = 'All'; shopState.team = null; shopState.era = 'all'; shopState.sort = 'new'; shopState.q = q; shopState.shown = CONFIG.PAGE; go('shop'); }
let slideAt = 0, slideT = null;
function renderSlider(){
  const el = $('#promo-slider'); if (!el) return;
  const slides = SLIDES.map(s => Object.assign({}, s, {items: shuffle(PRODUCTS.filter(s.f)).slice(0, 3)})).filter(s => s.items.length);
  el.innerHTML = `<div class="ps-track">${slides.map((s, i) => `
    <div class="ps-slide${i ? '' : ' on'}" style="--bg:${s.c};--ac:${s.a}" onclick="SLIDES.find(x=>x.k==='${s.k}').go()">
      <div class="ps-copy"><div class="ps-kick">Futbol Mundo</div><h2>${escapeHtml(s.t)}</h2><p>${escapeHtml(s.s)}</p><span class="ps-btn">Shop now →</span></div>
      <div class="ps-imgs">${s.items.map((p, j) => `<img src="${escapeAttr(p.i)}" alt="${escapeAttr(p.n)}" loading="${i ? 'lazy' : 'eager'}" class="ps-i${j}">`).join('')}</div>
    </div>`).join('')}</div>
    <button class="ps-nav ps-prev" aria-label="Previous" onclick="event.stopPropagation();slideGo(-1)">‹</button><button class="ps-nav ps-next" aria-label="Next" onclick="event.stopPropagation();slideGo(1)">›</button>
    <div class="ps-dots">${slides.map((s, i) => `<button class="${i ? '' : 'on'}" aria-label="${escapeAttr(s.t)}" onclick="event.stopPropagation();slideTo(${i})"></button>`).join('')}</div>`;
  slideAt = 0; slideAuto();
  let x0 = null;
  el.ontouchstart = e => { x0 = e.touches[0].clientX; };
  el.ontouchend = e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) slideGo(dx < 0 ? 1 : -1); x0 = null; };
}
function slideTo(i){
  const s = document.querySelectorAll('#promo-slider .ps-slide'), d = document.querySelectorAll('#promo-slider .ps-dots button');
  if (!s.length) return;
  slideAt = (i + s.length) % s.length;
  s.forEach((x, j) => x.classList.toggle('on', j === slideAt)); d.forEach((x, j) => x.classList.toggle('on', j === slideAt));
  slideAuto();
}
function slideGo(d){ slideTo(slideAt + d); }
function slideAuto(){ clearTimeout(slideT); slideT = setTimeout(() => slideGo(1), 5000); }
renderSlider();
