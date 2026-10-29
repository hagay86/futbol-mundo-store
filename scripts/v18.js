// =====================================================================
// FUTBOL MUNDO v18 — the starting eleven only ever holds real players.
// Demo players stay visible in the Club tab only.
// =====================================================================
autoPick = function(silent){
  const pool = realCards();
  if (!pool.length) { gTab('packs'); return; }
  G.squad = {}; const used = new Set();
  const sorted = pool.slice().sort((a, b) => b.rating - a.rating);
  const keys = slotKeys();
  keys.forEach(s => { const c = sorted.find(c => !used.has(c.id) && c.pos === s.pos); if (c) { G.squad[s.key] = c.id; used.add(c.id); } });
  keys.forEach(s => { if (G.squad[s.key]) return; const c = sorted.find(c => !used.has(c.id)); if (c) { G.squad[s.key] = c.id; used.add(c.id); } });
  save(); if (!silent) { renderSquad(); showToast('Best eleven picked'); }
};
function purgeDemoXI(){
  const bad = Object.entries(G.squad || {}).some(([, id]) => { const c = cardById(id); return !c || c.demo; });
  if (bad || Object.keys(G.squad || {}).length < 11) autoPick(true);
}
purgeDemoXI();
if (typeof syncLoad === 'function') { const _syncLoad18 = syncLoad; syncLoad = async function(){ const r = await _syncLoad18.apply(this, arguments); purgeDemoXI(); return r; }; }
const _seedDemo18 = seedDemo;
seedDemo = function(){ _seedDemo18(); purgeDemoXI(); };
