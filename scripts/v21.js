<script>
// =====================================================================
// MUNDO v21 — only real players. Every card in the game is a real
// footballer with his real EA SPORTS FC rating and position:
// lower-league pros (47–58, from the same EA FC ratings database) fill
// the cheap ranges and the starting academy XI; retro/icon cards are
// real top players at their real rating; old saves are converted.
// =====================================================================
const FC_LOW_RAW = "Jenson Kilroy|48|GK|Walsall;Gong Si Hyeun|49|GK|Jeonbuk Hyundai;Seo Jeong Hyeok|50|LB|Jeonbuk Hyundai;Kim Ji Woon|47|RB|Jeju United;Tahir Reid-Brown|48|LB|Orlando City;Ian James|50|CB|Sporting KC;Jo Hyun Tae|49|CB|Gangwon FC;Aaron Heaney|48|CB|Derry City;Cho Young Kwang|49|RB|FC Seoul;Alex Nunes|50|CAM|Newcastle Jets;Jang Jung Woo|48|CM|FC Anyang;Sung Jin Young|49|CAM|Jeonbuk Hyundai;Luca Moore|50|CM|Crewe Alexandra;Jang Nam Ung|49|CM|Jeonbuk Hyundai;Kim Dong Min|47|CDM|Pohang Steelers;Baek In Woo|48|CAM|Ulsan HD FC;Yutaro Tsukada|49|LW|Orlando City;Kang Min Jae|50|ST|Jeju United;Abdulmalek Al Harbi|50|LW|Al Kholood;Baek Seung Won|48|RW|Pohang Steelers;Lee Heon Jae|49|RW|Pohang Steelers;Markus Anderson|50|LW|Philadelphia;Kamil Dudek|53|GK|Burton Albion;Jake Oram|52|GK|Doncaster;Alfie Marriott|54|GK|Watford;Regan Donelon|54|LB|Galway United;Thomas Williams|53|CB|Orlando City;Kenny Nielsen|53|CB|LAFC;Răzvan Creț|53|LB|FC Botoșani;Drew Baiera|51|RB|New York City FC;Choi Chul Soon|54|RB|Jeonbuk Hyundai;Dan Ellison|53|CB|Bristol Rovers;Rohat Matyar|51|CB|Barnet;Park Jang Han Gyeol|51|CAM|FC Seoul;Joel Anasmo|54|LM|Perth Glory;Jack Blower|52|CM|Barnet;Quinn MacNicol|54|CAM|Brisbane Roar;Matei Frunză|54|CM|SC Oțelul Galați;Ali Al Hussain|54|CM|Al Fayha;Ibrahim Raache|53|CM|FC Annecy;Diego Porcel|54|ST|Argentinos Jrs.;Park Jeong Hoon|52|LW|FC Anyang;Mateusz Głowiński|54|ST|Korona Kielce;Raul Bucur|52|ST|FC Petrolul;Hwang ByeongGeun|58|GK|FC Anyang;Timo Schlieck|57|GK|Fürth;Augustin Delbecque|57|GK|Le Mans FC;Yuri Casermeiro|58|CB|Central Córdoba;James Bolger|58|CB|Drogheda United;Hayden Cann|58|CB|Derry City;Idriss Planeix|56|CB|En Avant Guingamp;Matteo Schablas|58|LB|FK Austria Wien;Seán Grehan|57|CB|Doncaster;Adam Kaszuba|57|LB|Sarpsborg 08;Sumaila Awudu|56|LB|Clermont Foot 63;Emre Gül|57|CAM|FC Ingolstadt 04;Keith Buckley|58|CDM|Bohemians;Wataru Kamijo|56|CDM|Sydney FC;Seb Quirk|57|CM|Sligo Rovers;Darragh Nugent|58|CM|Shamrock Rovers;Jakob Swift|56|CAM|Sandefjord;Jacob Bartlett|58|CDM|Sporting KC;Josh Thomas|58|ST|Drogheda United;Malcolm Fry|57|RW|New England;Marcus Younis|58|RW|Brøndby IF;Nicolás Rodríguez|56|RW|Orlando City;Kim Kyung Joon|58|ST|Gimcheon Sangmu;Thomas Oluwa|57|ST|Drogheda United";
const FC_LOW = FC_LOW_RAW.split(';').map(s => { const [name, r, rp, team] = s.split('|'); return {key:null, team, name, r:+r, rp, cat:FC_CAT(rp), low:1}; });
FC_LOW.forEach(p => FC_ALL.push(p));
const fcNorm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\.$/, '').trim();
const FC_IDX = {};
FC_ALL.forEach(p => { (FC_IDX[fcNorm(p.name)] = FC_IDX[fcNorm(p.name)] || []).push(p); });
const fcTeamOf = p => p.key ? TEAM_LABEL(p.key) : p.team;
function fcFind(name, team){
  const nm = fcNorm(name), hits = FC_IDX[fcNorm(FC_NAME_ALIAS[nm] || nm)] || [];
  if (!hits.length) return null;
  const t = fcNorm(team);
  return hits.find(h => fcNorm(fcTeamOf(h)) === t) || hits[0];
}
function fcShirtFor(p, retro){
  if (!p.key) return '';
  const shirts = PRODUCTS.filter(x => x.shirt && (!retro || x.c === 'Retro'));
  const tp = shirts.filter(x => x.n.toLowerCase().includes(p.key));
  const pool = tp.length ? tp : shirts;
  return (pool[Math.floor(Math.random() * pool.length)] || {}).i || '';
}
function fcCard(p, retro){
  const c = makeCard({player:p.name, num:FC_NUM[p.rp] || 8, team:fcTeamOf(p), img:fcShirtFor(p, retro), rating:p.r, pos:p.cat});
  c.rating = p.r; c.rp = p.rp; c.pos = p.cat; c.fc = 1; if (retro) c.icon = true;
  return c;
}
function fcPick({target, pos, min, max, top}){
  let pool = FC_ALL.filter(p => (!pos || p.cat === pos) && (!min || p.r >= min) && (!max || p.r <= max) && (!top || p.r >= 86));
  if (!pool.length) pool = FC_ALL.filter(p => !pos || p.cat === pos);
  if (!pool.length) pool = FC_ALL;
  const fresh = pool.filter(p => !FC_RECENT.includes(p.name)); if (fresh.length > 8) pool = fresh;
  let best = Infinity; pool.forEach(p => { best = Math.min(best, Math.abs(p.r - target)); });
  const near = pool.filter(p => Math.abs(p.r - target) <= Math.max(best + 1, 2));
  const p = near[Math.floor(Math.random() * near.length)];
  FC_RECENT.push(p.name); if (FC_RECENT.length > 30) FC_RECENT.shift();
  return p;
}
randomCard = function(o = {}){
  if (o.retro) return fcCard(fcPick({target:88 + Math.random() * 3, pos:o.pos, top:true}), true);
  const target = o.lo !== undefined ? o.lo + (o.hi - o.lo) * Math.pow(Math.random(), o.skew || 1.8) : 70 + Math.random() * 20;
  return fcCard(fcPick({target, pos:o.pos, min:o.minRating}), false);
};
// Any card built from a real name gets that player's real rating and position.
const _makeCard21 = makeCard;
makeCard = function(o){
  const c = _makeCard21(o);
  const p = o && o.player && fcFind(o.player, o.team);
  if (p) { c.player = p.name; c.rating = p.r; c.rp = p.rp; c.pos = p.cat; c.fc = 1; }
  return c;
};
// Shirt rosters and bot squads: real players only.
for (const k of Object.keys(ROSTERS)) {
  const fk = FC_ALIAS[k] || k;
  if (FC_DATA[fk]) ROSTERS[k] = FC_DATA[fk].map(([name, r, rp]) => [FC_NUM[rp] || 8, name]);
}
ALL_ROSTER.splice(0, ALL_ROSTER.length, ...Object.entries(ROSTERS).filter(([k, v]) => k !== '_custom' && v.length && FC_DATA[FC_ALIAS[k] || k]));
// Academy XI: 11 real low-rated pros (47–50).
grantStarterXI = function(){
  if (G.starterXI) return;
  G.starterXI = Date.now();
  const plan = [['GK','GK'],['DEF','RB'],['DEF','CB'],['DEF','CB'],['DEF','LB'],['MID','CDM'],['MID','CM'],['MID','CAM'],['FWD','RW'],['FWD','ST'],['FWD','LW']];
  const used = new Set();
  plan.forEach(([cat, rp]) => {
    let pool = FC_LOW.filter(p => p.r <= 50 && p.rp === rp && !used.has(p.name));
    if (!pool.length) pool = FC_LOW.filter(p => p.r <= 50 && p.cat === cat && !used.has(p.name));
    if (!pool.length) pool = FC_LOW.filter(p => p.cat === cat && !used.has(p.name));
    const p = pool[Math.floor(Math.random() * pool.length)]; used.add(p.name);
    const c = fcCard(p, false); c.rp = rp; c.rookie = true;
    G.cards.push(c);
  });
  autoPick(true); save();
};
// Old saves: every card that isn't a real EA FC player becomes one,
// same position and the nearest real rating, so squads stay intact.
function fcRealize(c){
  if (!c || !c.player || c.item) return false;
  const p = fcFind(c.player, c.team);
  if (p) {
    if (c.rating === p.r && c.rp === p.rp && c.fc && c.player === p.name) return false;
    c.player = p.name; c.rating = p.r; c.rp = p.rp; c.pos = p.cat; c.team = fcTeamOf(p); c.fc = 1; return true;
  }
  const weak = c.rookie || c.noob || c.rating < 59;
  const q = fcPick({target:c.rating || 70, pos:c.pos, max:weak ? 58 : undefined, top:c.icon && c.rating >= 86});
  c.player = q.name; c.rating = q.r; c.rp = q.rp; c.pos = q.cat; c.team = fcTeamOf(q); c.num = FC_NUM[q.rp] || c.num; c.fc = 1;
  if (!q.key) c.img = c.img || '';
  return true;
}
function fcMigrateAll(){
  let changed = false;
  (G.cards || []).forEach(c => { if (fcRealize(c)) changed = true; });
  Object.values(G.issued || {}).forEach(v => { if (v && v.player && fcRealize(v)) changed = true; });
  (G.listings || []).forEach(l => { if (l && l.card && fcRealize(l.card)) changed = true; });
  if (changed) { try { save(); } catch (e) {} }
}
fcMigrateAll();
if (typeof syncLoad === 'function') { const _syncLoad21 = syncLoad; syncLoad = async function(){ const r = await _syncLoad21.apply(this, arguments); fcMigrateAll(); return r; }; }
</script>
