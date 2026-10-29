// =====================================================================
// FUTBOL MUNDO v10 — Mundo XI players use real EA SPORTS FC ratings and
// positions (scripts/fc_ratings.json, from ea.com/games/ea-sports-fc/ratings).
// =====================================================================
const FC_DATA = __FC_DATA__;
const FC_ALIAS = {'man city':'manchester city'};
const FC_CAT = p => p === 'GK' ? 'GK' : ['CB','LB','RB','LWB','RWB'].includes(p) ? 'DEF' : ['ST','CF','LW','RW'].includes(p) ? 'FWD' : 'MID';
const FC_NUM = {GK:1, RB:2, LB:3, CB:4, CDM:6, CM:8, CAM:10, LM:11, LW:11, RM:7, RW:7, ST:9, CF:9};
const FC_ALL = [];
for (const [k, list] of Object.entries(FC_DATA)) for (const [name, r, rp] of list) FC_ALL.push({key:k, name, r, rp, cat:FC_CAT(rp)});
const FC_RECENT = [];
const FC_MIN = Math.min(...FC_ALL.map(p => p.r));
const _randomCard10 = randomCard;
randomCard = function(o = {}){
  if (o.retro) return _randomCard10(o);
  let target;
  if (o.lo !== undefined) {
    if (o.hi < FC_MIN) { const c = _randomCard10(o); c.player = 'Academy Rookie'; return c; }
    target = o.lo + (o.hi - o.lo) * Math.pow(Math.random(), o.skew || 1.8);
  } else target = 70 + Math.random() * 20;
  let pool = FC_ALL.filter(p => (!o.pos || p.cat === o.pos) && (!o.minRating || p.r >= o.minRating));
  if (!pool.length) pool = FC_ALL;
  // players closest to the wanted rating, then one of them at random
  // Few real players sit below 66, so cheap picks spread over 64–74 instead.
  if (target < 66) target = 64 + Math.random() * 10;
  const fresh = pool.filter(p => !FC_RECENT.includes(p.name));
  if (fresh.length > 20) pool = fresh;
  let best = Infinity; pool.forEach(p => { best = Math.min(best, Math.abs(p.r - target)); });
  const near = pool.filter(p => Math.abs(p.r - target) <= Math.max(best + 1, 2));
  const p = near[Math.floor(Math.random() * near.length)];
  FC_RECENT.push(p.name); if (FC_RECENT.length > 30) FC_RECENT.shift();
  const shirts = PRODUCTS.filter(x => x.shirt);
  const tp = shirts.filter(x => x.n.toLowerCase().includes(p.key));
  const prod = (tp.length ? tp : shirts)[Math.floor(Math.random() * (tp.length || shirts.length))] || {};
  const c = makeCard({player:p.name, num:FC_NUM[p.rp] || 8, team:TEAM_LABEL(p.key), img:prod.i, rating:p.r, pos:p.cat});
  c.rating = p.r; c.rp = p.rp; c.fc = 1;
  return c;
};
const _cardPos10 = cardPos;
cardPos = function(c){ return c.rp || _cardPos10(c); };
// Old saves: give cards of real players their real EA FC rating and position.
const FC_NAME_ALIAS = {'vinícius jr':'vini jr.', 'vinicius jr':'vini jr.', 'vinícius':'vini jr.', 'de bruyne':'kevin de bruyne', 'kevin de bruyne':'kevin de bruyne', 'mbappé':'kylian mbappé', 'messi':'lionel messi', 'ronaldo':'cristiano ronaldo', 'lautaro m.':'lautaro martínez', 'martinez e.':'emiliano martínez'};
function fcMigrate(){
  let changed = false;
  const bySur = {};
  FC_ALL.forEach(p => { const s = p.name.split(' ').pop().toLowerCase(); (bySur[s] = bySur[s] || []).push(p); bySur[p.name.toLowerCase()] = [p]; });
  (G.cards || []).forEach(c => {
    if (c.fc || c.icon || c.noob || !c.player) return;
    const nm = c.player.toLowerCase(), sur = nm.replace(/\.$/, '').split(' ').pop();
    const team = String(c.team || '').toLowerCase();
    const hits = bySur[FC_NAME_ALIAS[nm] || nm] || bySur[sur] || [];
    const p = hits.find(h => h.key === team || TEAM_LABEL(h.key).toLowerCase() === team) || hits[0];
    if (p) { c.player = p.name; c.rating = p.r; c.rp = p.rp; c.pos = p.cat; c.fc = 1; changed = true; }
  });
  if (changed) { try { save(); } catch (e) {} }
}
fcMigrate();
if (typeof syncLoad === 'function') { const _syncLoad10 = syncLoad; syncLoad = async function(){ const r = await _syncLoad10.apply(this, arguments); fcMigrate(); return r; }; }
