// =====================================================================
// FUTBOL MUNDO v15 — everyone starts with a playable eleven of 11 very
// weak academy players (rated 38–46). They can play straight away, but
// even the Sunday League and the Bronze Cup are far above them.
// =====================================================================
const ROOKIE_FIRST = ['Tomi','Lenny','Rafa','Niko','Dani','Ozzy','Benji','Marco','Teo','Jules','Kofi','Iker','Sami','Luca','Bram','Enzo','Yuri','Caio','Milo','Arlo'];
const ROOKIE_LAST = ['Pantoja','Kessel','Moreno','Brack','Osei','Lindqvist','Ferro','Duval','Okafor','Marsh','Vidic','Santoro','Hale','Pires','Novak','Quint','Rocha','Bauer','Ilic','Dorn'];
function grantStarterXI(){
  if (G.starterXI) return;
  G.starterXI = Date.now();
  const plan = ['GK','DEF','DEF','DEF','DEF','MID','MID','MID','FWD','FWD','FWD'];
  const rp = {GK:['GK'], DEF:['RB','CB','CB','LB'], MID:['CDM','CM','CAM'], FWD:['RW','ST','LW']}, idx = {GK:0, DEF:0, MID:0, FWD:0};
  const used = new Set();
  plan.forEach(pos => {
    let name; do { name = ROOKIE_FIRST[Math.floor(Math.random() * ROOKIE_FIRST.length)] + ' ' + ROOKIE_LAST[Math.floor(Math.random() * ROOKIE_LAST.length)]; } while (used.has(name)); used.add(name);
    const real = rp[pos][idx[pos]++ % rp[pos].length];
    const c = makeCard({player:name, num:FC_NUM[real] || 8, team:'Mundo Academy', img:'', rating:38 + Math.floor(Math.random() * 9), pos});
    c.rp = real; c.rookie = true; c.fc = 1;
    G.cards.push(c);
  });
  autoPick(true); save();
}
grantStarterXI();
if (typeof syncLoad === 'function') { const _syncLoad15 = syncLoad; syncLoad = async function(){ const r = await _syncLoad15.apply(this, arguments); grantStarterXI(); return r; }; }
