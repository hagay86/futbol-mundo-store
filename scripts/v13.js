// =====================================================================
// FUTBOL MUNDO v13 — offline competitions, daily limits, 10-league ladder
// with a brutal final league, 3D walkouts, 3D match view, practice pitch.
// =====================================================================

// ---------- Trade market removed ----------
const _gTab13 = gTab;
gTab = function(t){ return _gTab13(t === 'market' ? 'play' : t); };

// ---------- Daily limits ----------
const fmDay13 = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const msToMidnight = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d - Date.now(); };
const fmtWait = ms => { const m = Math.ceil(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
const cupDone = () => G.cupDay === fmDay13();

// ---------- League ladder: 10 leagues, the last one is brutal ----------
const LEAGUE_NAMES = {10:'Sunday League', 9:'Amateur League', 8:'Regional League', 7:'National League', 6:'Second Division', 5:'First Division', 4:'Super League', 3:'Continental League', 2:'Champions League', 1:'Mundo Elite League'};
const divRange13 = function(d){
  if (d <= 1) return [89, 93];                 // the final league: the best squads in the game
  const lo = 55 + (10 - d) * 3.6; return [lo, lo + 5];
};
// A season is a full 20-team league: 38 matchdays, home and away. No daily limit on league games.
const LEAGUE_TEAMS = 20;
newSeason = function(div, season){
  const names = shuffle(BOT_NAMES.concat(BOT_NAMES.map(n => n + '_fc'))).filter((n, i, a) => a.indexOf(n) === i).slice(0, LEAGUE_TEAMS - 1);
  const [lo, hi] = divRange13(div);
  const teams = names.map(n => ({name:n, str:Math.round((lo + Math.random() * (hi - lo)) * 10) / 10}));
  const table = {You:{p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}};
  teams.forEach(t => table[t.name] = {p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
  G.career = {div, season, teams, order:shuffle(names).concat(shuffle(names)), round:0, table, results:[], done:null, size:LEAGUE_TEAMS};
  save();
};
const seasonLen = C => C.order.length;
const promoN = C => C.size === LEAGUE_TEAMS ? 3 : 2;
careerPlay = function(mode){
  const C = career(); const opp = C.order[C.round];
  openMatch({oppName:opp, oppStr:strOf(opp), title:`${LEAGUE_NAMES[C.div]} · Matchday ${C.round + 1} of ${seasonLen(C)}`, mode,
    reward:r => matchReward(C.div, r), onDone:r => afterCareer(opp, r)});
};
afterCareer = function(opp, r, quiet){
  const C = career();
  rec('You', r.gf, r.ga); rec(opp, r.ga, r.gf);
  C.results.push({opp, gf:r.gf, ga:r.ga});
  const others = shuffle(C.teams.map(t => t.name).filter(n => n !== opp));
  for (let i = 0; i + 1 < others.length; i += 2) { const [a, b] = simGoals(strOf(others[i]), strOf(others[i + 1])); rec(others[i], a, b); rec(others[i + 1], b, a); }
  C.round++;
  if (C.round >= seasonLen(C)) {
    const n = C.teams.length + 1, pos = standings().findIndex(x => x.n === 'You') + 1, pn = promoN(C);
    const bonus = Math.round((n + 1 - pos) * 40 * (11 - C.div) / 3);
    const move = pos <= pn && C.div > 1 ? 'up' : pos > n - pn && C.div < 10 ? 'down' : 'stay';
    C.done = {pos, bonus, move};
    G.points += bonus;
    if (pos === 1) G.trophies.push(`${LEAGUE_NAMES[C.div]} champions · Season ${C.season}`);
    if (pos === 1 && C.div === 1 && !G.grandPrize) G.grandPrize = {at:Date.now(), season:C.season};
    save();
    const msg = pos === 1 && C.div === 1 ? 'Mundo Elite League champions! You qualify for the grand prize.' : move === 'up' ? `Promoted to the ${LEAGUE_NAMES[C.div - 1]}!` : move === 'down' ? `Relegated to the ${LEAGUE_NAMES[C.div + 1]}.` : `You stay in the ${LEAGUE_NAMES[C.div]}.`;
    if (!quiet) openInfo(`Season over: ${ordinal(pos)} place`, `${msg} Season bonus: +Ɱ${bonus.toLocaleString()}.`);
  }
  save(); if (!quiet) renderSeason();
};
// Quick-sim a few matchdays (realistic results from the team ratings)
function quickSim(n){
  const C = career(); if (!squadFull() || C.done) return;
  let gf = 0, ga = 0, w = 0, d = 0, l = 0, got = 0;
  for (let k = 0; k < n && !C.done; k++) {
    const opp = C.order[C.round]; const [a, b] = simGoals(teamScore().total, strOf(opp));
    const r = {gf:a, ga:b, win:a > b, draw:a === b}; got += matchReward(C.div, r); G.points += matchReward(C.div, r);
    gf += a; ga += b; a > b ? w++ : a === b ? d++ : l++;
    afterCareer(opp, r, true);
  }
  save(); renderSeason();
  if (C.done) { const x = C.done; openInfo(`Season over: ${ordinal(x.pos)} place`, `${x.move === 'up' ? 'Promoted!' : x.move === 'down' ? 'Relegated.' : 'You stay up.'} Season bonus: +Ɱ${x.bonus.toLocaleString()}.`); }
  else showToast(`${w}W ${d}D ${l}L · goals ${gf}–${ga} · +Ɱ${got.toLocaleString()}`);
}
const _renderSeason13 = renderSeason;
renderSeason = function(){
  _renderSeason13();
  const C = career(), el = $('#season-main'); if (!el) return;
  const [lo, hi] = divRange13(C.div), len = seasonLen(C), n = C.teams.length + 1, pn = promoN(C);
  el.innerHTML = el.innerHTML.replace(/Matchday (\d+) of \d+/, `Matchday $1 of ${len}`).replace(/Division (\d+) · Season/, (m, d) => `${LEAGUE_NAMES[d]} · Season`).replace(/Division (\d+) table/, (m, d) => `${LEAGUE_NAMES[d]} table`).replace(/Division \d+ teams are rated \d+–\d+/, `${LEAGUE_NAMES[C.div]} teams are rated ${Math.round(lo)}–${Math.round(hi)}`);
  el.querySelectorAll('.board-row.lg:not(.head)').forEach((row, i) => { row.classList.toggle('promo', i < pn && C.div > 1); row.classList.toggle('rel', i >= n - pn && C.div < 10); });
  const zones = el.querySelector('p.muted:last-of-type'); if (zones) zones.innerHTML = `${C.div > 1 ? `<span class="zone up"></span>Top ${pn} promoted ` : ''}${C.div < 10 ? `<span class="zone down"></span>Bottom ${pn} relegated` : ''}`;
  el.insertAdjacentHTML('afterbegin', `<div class="daily-bar"><b>${LEAGUE_NAMES[C.div]}</b><span>${n} teams · ${len} matchdays · play as many as you like</span><span class="muted">Opponents rated ${Math.round(lo)}–${Math.round(hi)}${C.div === 1 ? ' · the hardest league in the game' : ''}</span></div>`);
  const btns = el.querySelector('.nm-btns');
  if (btns && !C.done && squadFull()) btns.insertAdjacentHTML('afterend', `<div class="qs-row"><button class="btn btn-ghost btn-sm" onclick="quickSim(5)">Quick-sim 5 matches</button><button class="btn btn-ghost btn-sm" onclick="quickSim(${len})">Sim rest of season</button></div>`);
  el.insertAdjacentHTML('beforeend', `<div class="gp-box${G.grandPrize ? ' won' : ''}"><b>🏆 Grand prize</b><p>${G.grandPrize ? 'You won the Mundo Elite League. You qualify for the grand prize. We will contact you by email.' : 'Only for managers who climb all 10 leagues and then win the Mundo Elite League, where every team is rated 89–93.'}</p></div>`);
  const side = $('#season-side .div-badge'); if (side) side.innerHTML = `<b>${C.div}</b>${LEAGUE_NAMES[C.div]}`;
};
CONFIG.PRIZE_TITLE = 'Win the Mundo Elite League';
CONFIG.PRIZE_TEXT = 'Every manager starts in the Sunday League. Climb all 10 leagues (38 matchdays each) and then win the Mundo Elite League, where every team is rated 89–93. Only those champions qualify for the grand prize: a trip for two to a top-flight match, flights and hotel included.';

// ---------- Offline cups: one entry a day, opponents matched to the cup ----------
CUPS.length = 0;
CUPS.push(
  {id:'quick', name:'Bronze Cup', range:[58, 70], reward:[1500, 600, 250], minXI:0},
  {id:'pro',   name:'Silver Cup', range:[68, 79], reward:[3000, 1200, 500], minXI:0},
  {id:'elite', name:'Gold Cup',   range:[77, 85], reward:[6000, 2500, 1000], minXI:0},
  {id:'mundo', name:'Mundo Cup',  range:[84, 90], reward:[12000, 5000, 2000], minXI:0},
);
enterCup = function(id){
  const c = CUPS.find(x => x.id === id);
  if (!squadFull()) { showToast('Fill all 11 places in your squad to enter cups'); gTab('squad'); return; }
  if (G.cupLive.some(L => !L.done)) { showToast('Finish the cup you are playing first'); return; }
  if (cupDone()) { openInfo('One cup a day', `You have already entered a cup today. The next entry opens in ${fmtWait(msToMidnight())}.`); return; }
  G.cupDay = fmDay13();
  const bots = shuffle(BOT_NAMES).slice(0, CUP_SIZE - 1).map(n => ({name:n, str:Math.round((c.range[0] + Math.random() * (c.range[1] - c.range[0])) * 10) / 10}));
  const teams = shuffle([{name:'You', me:true}, ...bots]);
  const r0 = []; for (let i = 0; i < CUP_SIZE; i += 2) r0.push({a:teams[i], b:teams[i + 1]});
  G.cupLive = G.cupLive.filter(L => !L.done).concat([{id:newId(), cup:c.id, name:c.name, start:Date.now(), rounds:[r0], done:false}]);
  save(); renderCups();
  showToast(`You're in the ${c.name}. Play your round of 16 match`);
};
checkCups = function(){};
finishCup = function(L, champ){
  let place = 9;
  L.rounds.forEach((r, i) => r.forEach(m => { if ((m.a.me || m.b.me) && !(m.w === 'a' ? m.a.me : m.b.me)) place = [9, 5, 3, 2][i]; }));
  if (champ.me) place = 1;
  const c = CUPS.find(x => x.id === L.cup) || CUPS[0];
  L.place = place; L.prize = place === 1 ? c.reward[0] : place === 2 ? c.reward[1] : place === 3 ? c.reward[2] : 0;
  L.done = true; L.champ = champ.name;
  G.points += L.prize;
  if (place === 1) G.trophies.push(`${L.name} winner`);
  G.cupHistory.unshift({name:L.name, start:L.start, place, prize:L.prize}); G.cupHistory = G.cupHistory.slice(0, 20);
  save();
  setTimeout(() => openInfo(place === 1 ? `${L.name} champions!` : `${L.name}: ${placeText(place)}`, `${L.prize ? `You won Ɱ${L.prize.toLocaleString()}.` : 'No prize this time.'} ${place === 1 ? 'A new trophy for your cabinet.' : `@${escapeHtml(champ.name === 'You' ? 'you' : champ.name)} won the cup.`} Your next cup entry opens tomorrow.`), 400);
};
renderCups = function(){
  const full = squadFull(), me = full ? teamScore().total : 0;
  const live = G.cupLive.filter(L => !L.done || Date.now() - L.start < 6 * 3600e3);
  $('#cups-main').innerHTML = `${live.map(liveCupHTML).join('').replace(/Live now/g, 'In progress')}
  <div class="daily-bar${cupDone() ? ' used' : ''}"><b>Cups</b><span>${cupDone() ? `Today's cup entry is used · next one in ${fmtWait(msToMidnight())}` : 'One free cup entry a day · 16 teams, knockout, played right now'}</span></div>
  ${!full ? `<div class="lock" style="margin-bottom:24px;padding:24px"><h3>Cups need a full eleven</h3><p>You have ${teamScore().xi.length}/11.</p><button class="btn btn-pri btn-sm" onclick="gTab('squad')">Fill your eleven</button></div>` : ''}
  <div class="cups">${CUPS.map(c => {
    const fit = !full ? '' : me < c.range[0] - 3 ? '<span class="fit hard">Very hard for your squad</span>' : me > c.range[1] + 2 ? '<span class="fit easy">Easy for your squad</span>' : '<span class="fit ok">Good match for your squad</span>';
    const btn = !full ? `<button class="btn btn-ghost" onclick="gTab('squad')">Fill your eleven first</button>`
      : cupDone() ? `<button class="btn btn-ghost" disabled>Next entry in ${fmtWait(msToMidnight())}</button>`
      : `<button class="btn btn-gold" onclick="enterCup('${c.id}')">Enter today</button>`;
    return `<div class="cup"><div class="cup-top"><b>${c.name}</b><span>16 teams rated ${c.range[0]}–${c.range[1]}</span></div>${fit}
      <div class="score-rows"><div><span>Winner</span><b>Ɱ${c.reward[0].toLocaleString()}</b></div><div><span>Runner-up</span><b>Ɱ${c.reward[1].toLocaleString()}</b></div><div><span>Semi-final</span><b>Ɱ${c.reward[2].toLocaleString()}</b></div></div>
      <div class="cup-btns">${btn}</div></div>`;
  }).join('')}</div>
  ${G.cupHistory.length ? `<h3 class="h3" style="font-size:24px;margin-top:32px">Past cups</h3>${G.cupHistory.slice(0, 8).map(r => `<div class="res"><span class="wdl ${r.place === 1 ? 'w' : r.place <= 3 ? 'd' : 'l'}">${r.place === 1 ? '1st' : r.place === 2 ? '2nd' : r.place === 3 ? 'SF' : r.place === 5 ? 'QF' : 'R16'}</span><span>${escapeHtml(r.name)}</span><b>${r.prize ? '+Ɱ' + r.prize.toLocaleString() : ''}</b></div>`).join('')}` : ''}`;
  const w = $('#wallet'); if (w) w.innerHTML = `<div class="sub">Your Mundo Credits</div><div class="big">Ɱ${G.points.toLocaleString()}</div>
    <div class="score-rows"><div><span>Cup entry today</span><b>${cupDone() ? 'Used' : 'Available'}</b></div></div>
    <button class="btn btn-pitch" style="width:100%;margin-top:12px" onclick="openPractice()">Practice pitch (3D)</button>`;
};

// ---------- three.js loader ----------
let THREE_P = null;
function loadThree(){
  if (window.THREE) return Promise.resolve(window.THREE);
  if (THREE_P) return THREE_P;
  THREE_P = new Promise((ok, bad) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; s.onload = () => ok(window.THREE); s.onerror = () => { THREE_P = null; bad(new Error('3D unavailable')); }; document.head.appendChild(s); });
  return THREE_P;
}
const hasWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } })();
const LOW_GFX = matchMedia('(pointer: coarse)').matches;

// ---------- Kit colours ----------
const KITS = [
  [/real madrid/i, '#f4f4f4', '#d4af37'], [/barcelona/i, '#a50044', '#004d98', 'stripes'], [/manchester united|man utd/i, '#da291c', '#111'],
  [/manchester city|man city/i, '#6cabdd', '#fff'], [/liverpool/i, '#c8102e', '#fff'], [/chelsea/i, '#034694', '#fff'], [/arsenal/i, '#ef0107', '#fff'],
  [/tottenham|spurs/i, '#f8f8f8', '#132257'], [/newcastle/i, '#111', '#f4f4f4', 'stripes'], [/aston villa/i, '#670e36', '#95bfe5'], [/bayern/i, '#dc052d', '#fff'],
  [/dortmund/i, '#fde100', '#111'], [/leverkusen/i, '#e32221', '#111'], [/leipzig/i, '#f4f4f4', '#dd0741'], [/juventus/i, '#111', '#f4f4f4', 'stripes'],
  [/inter/i, '#0068a8', '#111', 'stripes'], [/milan/i, '#fb090b', '#111', 'stripes'], [/napoli/i, '#12a0d7', '#fff'], [/roma/i, '#8e1f2f', '#f0bc42'],
  [/lazio/i, '#87d8f7', '#fff'], [/psg|paris/i, '#004170', '#da291c'], [/marseille/i, '#f4f4f4', '#2faee0'], [/atletico/i, '#cb3524', '#f4f4f4', 'stripes'],
  [/argentina/i, '#75aadb', '#f4f4f4', 'stripes'], [/brazil/i, '#ffdc02', '#009c3b'], [/france/i, '#1a2b5a', '#fff'], [/germany/i, '#f4f4f4', '#111'],
  [/spain/i, '#c60b1e', '#ffc400'], [/england/i, '#f4f4f4', '#1d3c8b'], [/portugal/i, '#c8102e', '#046a38'], [/netherlands|holland/i, '#f36c21', '#111'],
  [/italy/i, '#1f5fc4', '#fff'], [/mexico/i, '#006847', '#fff'], [/morocco/i, '#c1272d', '#006233'], [/japan/i, '#1b2a7a', '#fff'],
  [/usa|united states/i, '#f4f4f4', '#0a3161'], [/colombia/i, '#fcd116', '#003893'], [/uruguay/i, '#5cbfeb', '#111'], [/croatia/i, '#e4002b', '#f4f4f4', 'checks'],
];
function kitFor(team){
  const k = KITS.find(x => x[0].test(team || ''));
  if (k) return {a:k[1], b:k[2], pat:k[3] || ''};
  const h = hash(team || 'x'); const hues = [0, 210, 130, 45, 280, 190, 20];
  return {a:`hsl(${hues[h % hues.length]},70%,45%)`, b:'#fff', pat:''};
}
function jerseyTexture(T, kit, num, name){
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = kit.a; x.fillRect(0, 0, 512, 256);
  x.fillStyle = kit.b;
  if (kit.pat === 'stripes') for (let i = 0; i < 512; i += 64) x.fillRect(i + 20, 0, 24, 256);
  if (kit.pat === 'checks') for (let i = 0; i < 512; i += 48) for (let j = 0; j < 256; j += 48) if (((i + j) / 48) % 2 === 0) x.fillRect(i, j, 48, 48);
  // back (left half): name + big number; front (right half): badge + small number
  x.globalAlpha = .9; x.beginPath(); x.arc(426, 70, 18, 0, 7); x.fill(); x.globalAlpha = 1;
  x.textAlign = 'center'; x.fillStyle = kit.pat ? '#fff' : kit.b; x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 4;
  x.font = 'bold 42px Arial Black, Arial'; x.strokeText(String(num || ''), 384, 160); x.fillText(String(num || ''), 384, 160);
  x.font = 'bold 30px Arial Black, Arial'; const nm = String(name || '').toUpperCase().slice(0, 14);
  x.strokeText(nm, 128, 70); x.fillText(nm, 128, 70);
  x.font = 'bold 120px Arial Black, Arial'; x.strokeText(String(num || ''), 128, 200); x.fillText(String(num || ''), 128, 200);
  const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
}
// Low-poly footballer built from simple shapes. Returns {group, legs:[l,r], arms:[l,r]}
function makeFootballer(T, kit, opts = {}){
  const g = new T.Group();
  const skinTones = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
  const skin = new T.MeshStandardMaterial({color:opts.skin || skinTones[(opts.seed || 0) % skinTones.length], roughness:.7});
  const shirt = opts.detail ? new T.MeshStandardMaterial({map:jerseyTexture(T, kit, opts.num, opts.name), roughness:.6}) : new T.MeshStandardMaterial({color:kit.a, roughness:.6});
  const shorts = new T.MeshStandardMaterial({color:kit.pat === 'stripes' ? '#111' : kit.b === '#fff' || kit.b === '#f4f4f4' ? '#f4f4f4' : '#1b1f2a', roughness:.8});
  const sock = new T.MeshStandardMaterial({color:kit.a, roughness:.8});
  const boot = new T.MeshStandardMaterial({color:opts.boot || '#111', roughness:.4});
  const seg = opts.detail ? 18 : 8;
  const torso = new T.Mesh(new T.CylinderGeometry(.27, .22, .72, seg), shirt); torso.position.y = 1.28; torso.rotation.y = Math.PI / 2; g.add(torso);
  const hips = new T.Mesh(new T.CylinderGeometry(.23, .24, .26, seg), shorts); hips.position.y = .86; g.add(hips);
  const head = new T.Mesh(new T.SphereGeometry(.17, seg, seg), skin); head.position.y = 1.86; g.add(head);
  const neck = new T.Mesh(new T.CylinderGeometry(.07, .08, .12, 8), skin); neck.position.y = 1.68; g.add(neck);
  if (opts.detail) { const hair = new T.Mesh(new T.SphereGeometry(.175, seg, seg, 0, Math.PI * 2, 0, Math.PI / 2.2), new T.MeshStandardMaterial({color:['#1a1209', '#3b2412', '#6b4423', '#111', '#d6b370'][(opts.seed || 0) % 5]})); hair.position.y = 1.9; g.add(hair);
    const eyeM = new T.MeshBasicMaterial({color:'#1b1b1b'}); [-1, 1].forEach(e => { const m = new T.Mesh(new T.SphereGeometry(.022, 8, 8), eyeM); m.position.set(e * .06, 1.88, .155); g.add(m); });
    const brow = new T.Mesh(new T.BoxGeometry(.16, .015, .02), eyeM); brow.position.set(0, 1.925, .16); g.add(brow); }
  const limb = (r1, r2, len, mat) => { const m = new T.Mesh(new T.CylinderGeometry(r1, r2, len, 8), mat); m.position.y = -len / 2; const p = new T.Group(); p.add(m); return p; };
  const legs = [-1, 1].map(s => {
    const hip = new T.Group(); hip.position.set(s * .12, .8, 0);
    const thigh = limb(.1, .085, .42, shorts); hip.add(thigh);
    const shin = limb(.075, .06, .42, sock); shin.position.y = -.42; thigh.add(shin);
    const b = new T.Mesh(new T.BoxGeometry(.12, .08, .26), boot); b.position.set(0, -.44, .06); shin.add(b);
    g.add(hip); return {hip, knee:shin};
  });
  const arms = [-1, 1].map(s => {
    const sh = new T.Group(); sh.position.set(s * .34, 1.58, 0);
    const up = limb(.075, .065, .34, shirt); sh.add(up);
    const fore = limb(.06, .05, .32, skin); fore.position.y = -.34; up.add(fore);
    sh.rotation.z = s * .12; g.add(sh); return sh;
  });
  g.userData = {legs, arms, phase:Math.random() * 6};
  if (!LOW_GFX) g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function animateRun(f, speed, dt){
  const u = f.userData; u.phase += dt * (2 + speed * 1.6);
  const a = Math.min(1, speed / 6) * .8, s = Math.sin(u.phase);
  u.legs[0].hip.rotation.x = s * a; u.legs[1].hip.rotation.x = -s * a;
  u.legs[0].knee.rotation.x = Math.max(0, -s) * a * 1.2; u.legs[1].knee.rotation.x = Math.max(0, s) * a * 1.2;
  u.arms[0].rotation.x = -s * a * .8; u.arms[1].rotation.x = s * a * .8;
}

// ---------- 3D walkout ----------
let WO3 = null;
const _walkout13 = walkout;
walkout = function(card, done){
  if (!hasWebGL || matchMedia('(prefers-reduced-motion: reduce)').matches) return _walkout13(card, done);
  _walkout13(card, done);                       // keeps the text steps, skip and reveal logic
  WO.timers.forEach(clearTimeout); WO.timers = [];
  const el = $('#walkout'); el.classList.add('wo3d');
  let cv = $('#wo3d-canvas'); if (!cv) { el.insertAdjacentHTML('afterbegin', '<canvas id="wo3d-canvas"></canvas>'); cv = $('#wo3d-canvas'); }
  const stage = $('#wo-stage');
  const steps = [`<div class="wo-line"><small>Club</small>${escapeHtml(card.team)}</div>`, `<div class="wo-line"><small>Position</small>${escapeHtml(cardPos(card))} · #${card.num}</div>`, `<div class="wo-line"><small>Rating</small>${card.rating}</div>`];
  stage.innerHTML = '';
  loadThree().then(T => {
    if (!WO || WO.card !== card) return;
    startWalkout3D(T, cv, card);
    steps.forEach((h, i) => WO.timers.push(setTimeout(() => { if (WO && !WO.revealed) stage.innerHTML = h; }, 1400 + i * 1300)));
    WO.timers.push(setTimeout(() => revealWalkout(), 1400 + steps.length * 1300 + 400));
  }).catch(() => { WO.timers.push(setTimeout(revealWalkout, 600)); });
};
const _skipWalkout13 = skipWalkout;
skipWalkout = function(){ const was = WO && WO.revealed; _skipWalkout13(); if (was || !WO) stopWalkout3D(); };
function stopWalkout3D(){ if (!WO3) return; cancelAnimationFrame(WO3.raf); WO3.r.dispose(); WO3 = null; $('#walkout').classList.remove('wo3d'); }
function startWalkout3D(T, cv, card){
  stopWalkout3D();
  const w = innerWidth, h = innerHeight;
  const r = new T.WebGLRenderer({canvas:cv, antialias:!LOW_GFX, alpha:false}); r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.setSize(w, h, false);
  r.shadowMap.enabled = !LOW_GFX;
  const sc = new T.Scene(); sc.background = new T.Color('#05090f'); sc.fog = new T.Fog('#05090f', 14, 40);
  const cam = new T.PerspectiveCamera(38, w / h, .1, 100); cam.position.set(0, 1.6, 9);
  sc.add(new T.HemisphereLight('#8fb4ff', '#0b1a10', .35));
  const kit = kitFor(card.team);
  const gold = card.icon ? '#E8B730' : card.rating >= 88 ? '#7fd3ff' : '#E8B730';
  const spot = new T.SpotLight('#ffffff', 2.2, 30, .42, .6, 1.2); spot.position.set(0, 9, 4); spot.castShadow = !LOW_GFX; sc.add(spot); spot.target.position.set(0, 0, 0); sc.add(spot.target);
  const rim1 = new T.PointLight(gold, 1.6, 12); rim1.position.set(-3, 2.5, -2); sc.add(rim1);
  const rim2 = new T.PointLight(kit.a, 1.4, 12); rim2.position.set(3, 2.5, -2); sc.add(rim2);
  // pitch floor with centre circle
  const fc = document.createElement('canvas'); fc.width = fc.height = 512; const fx = fc.getContext('2d');
  for (let i = 0; i < 8; i++) { fx.fillStyle = i % 2 ? '#14532d' : '#166534'; fx.fillRect(0, i * 64, 512, 64); }
  fx.strokeStyle = 'rgba(255,255,255,.8)'; fx.lineWidth = 6; fx.beginPath(); fx.arc(256, 256, 150, 0, 7); fx.stroke(); fx.beginPath(); fx.moveTo(0, 256); fx.lineTo(512, 256); fx.stroke();
  const floor = new T.Mesh(new T.CircleGeometry(14, 64), new T.MeshStandardMaterial({map:new T.CanvasTexture(fc), roughness:.95}));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
  // light beams
  const beams = [];
  for (let i = 0; i < 6; i++) {
    const b = new T.Mesh(new T.ConeGeometry(1.2, 14, 24, 1, true), new T.MeshBasicMaterial({color:i % 2 ? gold : '#ffffff', transparent:true, opacity:.06, side:T.DoubleSide, depthWrite:false}));
    b.position.set((i - 2.5) * 2.4, 7, -6); b.rotation.z = (i - 2.5) * .12; sc.add(b); beams.push(b);
  }
  // sparks
  const N = 260, pg = new T.BufferGeometry(), pos = new Float32Array(N * 3), vel = [];
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 12; pos[i * 3 + 1] = Math.random() * 8; pos[i * 3 + 2] = -4 + Math.random() * 6; vel.push(.2 + Math.random() * .6); }
  pg.setAttribute('position', new T.BufferAttribute(pos, 3));
  const sparks = new T.Points(pg, new T.PointsMaterial({color:gold, size:.06, transparent:true, opacity:.8})); sc.add(sparks);
  const p = makeFootballer(T, kit, {detail:true, num:card.num, name:shortName(card.player), seed:hash(card.player)});
  p.position.set(0, 0, -9); sc.add(p);
  // big rating ring on the floor
  const ring = new T.Mesh(new T.RingGeometry(1.1, 1.25, 64), new T.MeshBasicMaterial({color:gold, transparent:true, opacity:.0, side:T.DoubleSide}));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .02; sc.add(ring);
  let t0 = performance.now(), last = t0;
  WO3 = {r, raf:0};
  const tick = now => {
    if (!WO3) return;
    const t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
    if (t < 3.2) { p.position.z = -9 + Math.min(1, t / 3.2) * 9; animateRun(p, 1.8, dt); p.rotation.y = 0; }
    else { const k = Math.min(1, (t - 3.2) / .5); p.userData.legs.forEach(l => { l.hip.rotation.x *= .85; l.knee.rotation.x *= .85; }); p.userData.arms.forEach(a => { a.rotation.x *= .85; });
      p.rotation.y = t > 4.2 ? Math.sin((t - 4.2) * .9) * Math.PI : 0; ring.material.opacity = .9 * k; ring.scale.setScalar(1 + .05 * Math.sin(t * 4)); }
    cam.position.z = 9 - Math.min(1, t / 6) * 3.4; cam.position.y = 1.6 + Math.sin(t * .5) * .1; cam.lookAt(0, 1.15, p.position.z * .3);
    beams.forEach((b, i) => { b.rotation.z = (i - 2.5) * .12 + Math.sin(t * .8 + i) * .12; });
    for (let i = 0; i < N; i++) { pos[i * 3 + 1] -= vel[i] * dt; if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 8; }
    pg.attributes.position.needsUpdate = true;
    r.render(sc, cam);
    WO3.raf = requestAnimationFrame(tick);
  };
  WO3.raf = requestAnimationFrame(tick);
}

// ---------- 3D match view ----------
const R3 = {on:hasWebGL && store.get('fm_3d', true), cam:0, s:null};
function r3Toggle(){ R3.on = !R3.on; store.set('fm_3d', R3.on); applyView(); }
function r3Cam(){ R3.cam = (R3.cam + 1) % 3; }
function applyView(){
  const st = $('#mo-stage'); if (!st) return;
  st.classList.toggle('view3d', R3.on);
  const b = $('#mo-3d'); if (b) b.textContent = R3.on ? '2D view' : '3D view';
  const c = $('#mo-cam'); if (c) c.style.display = R3.on ? '' : 'none';
  if (R3.on && M) r3Ensure().then(() => { if (M && M.S) r3Update(M.S, 0); });
  if (M) { resizeCanvas(); if (M.S) drawFrame(); else drawIdle(); }
}
function r3Ensure(){
  if (R3.s) return Promise.resolve(R3.s);
  return loadThree().then(T => {
    if (R3.s) return R3.s;
    const st = $('#mo-stage'); let cv = $('#mo-3d-canvas');
    if (!cv) { st.insertAdjacentHTML('afterbegin', '<canvas id="mo-3d-canvas"></canvas>'); cv = $('#mo-3d-canvas'); }
    const r = new T.WebGLRenderer({canvas:cv, antialias:!LOW_GFX}); r.setPixelRatio(Math.min(LOW_GFX ? 1.5 : 2, devicePixelRatio || 1));
    r.shadowMap.enabled = !LOW_GFX;
    const sc = new T.Scene(); sc.background = new T.Color('#0b1626'); sc.fog = new T.Fog('#0b1626', 120, 260);
    const cam = new T.PerspectiveCamera(40, 1, .5, 400);
    sc.add(new T.HemisphereLight('#cfe3ff', '#20402a', .55));
    const sun = new T.DirectionalLight('#ffffff', .85); sun.position.set(-40, 80, 30); sun.castShadow = !LOW_GFX;
    Object.assign(sun.shadow.camera, {left:-70, right:70, top:50, bottom:-50, far:200}); sun.shadow.mapSize.set(1024, 1024); sc.add(sun);
    // pitch
    const pc = document.createElement('canvas'); pc.width = 1050; pc.height = 680; const x = pc.getContext('2d');
    for (let i = 0; i < 14; i++) { x.fillStyle = i % 2 ? '#2f8a3e' : '#349746'; x.fillRect(i * 75, 0, 75, 680); }
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 4;
    x.strokeRect(10, 10, 1030, 660); x.beginPath(); x.moveTo(525, 10); x.lineTo(525, 670); x.stroke();
    x.beginPath(); x.arc(525, 340, 91.5, 0, 7); x.stroke();
    [[10, 1], [1040, -1]].forEach(([gx, d]) => { x.strokeRect(d > 0 ? gx : gx - 165, 340 - 201.5, 165, 403); x.strokeRect(d > 0 ? gx : gx - 55, 340 - 91.5, 55, 183); x.beginPath(); x.arc(gx + d * 110, 340, 91.5, d > 0 ? -.93 : Math.PI - .93, d > 0 ? .93 : Math.PI + .93); x.stroke(); });
    const tex = new T.CanvasTexture(pc); tex.anisotropy = 8;
    const pitch = new T.Mesh(new T.PlaneGeometry(105, 68), new T.MeshStandardMaterial({map:tex, roughness:.95}));
    pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; sc.add(pitch);
    const apron = new T.Mesh(new T.PlaneGeometry(140, 100), new T.MeshStandardMaterial({color:'#24713a', roughness:1})); apron.rotation.x = -Math.PI / 2; apron.position.y = -.02; sc.add(apron);
    // goals
    const postM = new T.MeshStandardMaterial({color:'#ffffff', roughness:.3});
    const netM = new T.MeshBasicMaterial({color:'#ffffff', wireframe:true, transparent:true, opacity:.25});
    [-1, 1].forEach(s => {
      const gx = s * 52.5, g = new T.Group();
      [[0, 1.22, -3.66], [0, 1.22, 3.66]].forEach(([a, y, z]) => { const m = new T.Mesh(new T.CylinderGeometry(.07, .07, 2.44, 8), postM); m.position.set(gx, y, z); g.add(m); });
      const bar = new T.Mesh(new T.CylinderGeometry(.07, .07, 7.32, 8), postM); bar.rotation.x = Math.PI / 2; bar.position.set(gx, 2.44, 0); g.add(bar);
      const net = new T.Mesh(new T.BoxGeometry(2, 2.44, 7.32, 4, 4, 8), netM); net.position.set(gx + s * 1, 1.22, 0); g.add(net);
      sc.add(g);
    });
    // stands with crowd
    const standM = new T.MeshStandardMaterial({color:'#1c2638', roughness:.9});
    const stands = [[0, -50, 130, 0], [0, 50, 130, Math.PI], [-75, 0, 84, Math.PI / 2], [75, 0, 84, -Math.PI / 2]];
    const crowdPos = [], crowdCol = [], palette = ['#e5e7eb', '#dc2626', '#2563eb', '#facc15', '#16a34a', '#111827', '#f97316'];
    stands.forEach(([sx, sz, len, rot]) => {
      for (let tier = 0; tier < 3; tier++) {
        const m = new T.Mesh(new T.BoxGeometry(len, 3, 6), standM);
        const g = new T.Group(); g.position.set(sx, 0, sz); g.rotation.y = rot; m.position.set(0, 1.5 + tier * 3, -tier * 6); g.add(m); sc.add(g);
        const n = LOW_GFX ? 120 : 260;
        for (let k = 0; k < n; k++) {
          const lx = (Math.random() - .5) * (len - 2), ly = 3.4 + tier * 3, lz = -tier * 6 + (Math.random() - .5) * 4;
          const v = new T.Vector3(lx, ly, lz).applyAxisAngle(new T.Vector3(0, 1, 0), rot).add(new T.Vector3(sx, 0, sz));
          crowdPos.push(v.x, v.y, v.z); const c = new T.Color(palette[k % palette.length]); crowdCol.push(c.r, c.g, c.b);
        }
      }
    });
    const cg = new T.BufferGeometry(); cg.setAttribute('position', new T.Float32BufferAttribute(crowdPos, 3)); cg.setAttribute('color', new T.Float32BufferAttribute(crowdCol, 3));
    const crowd = new T.Points(cg, new T.PointsMaterial({size:.9, vertexColors:true})); sc.add(crowd);
    // floodlights
    [[-60, -42], [60, -42], [-60, 42], [60, 42]].forEach(([fx, fz]) => {
      const pole = new T.Mesh(new T.CylinderGeometry(.4, .6, 34, 8), standM); pole.position.set(fx, 17, fz); sc.add(pole);
      const lamp = new T.Mesh(new T.BoxGeometry(6, 3, .8), new T.MeshBasicMaterial({color:'#fffbe6'})); lamp.position.set(fx, 34, fz); lamp.lookAt(0, 0, 0); sc.add(lamp);
    });
    // ball + marker
    const ball = new T.Mesh(new T.SphereGeometry(.24, 16, 12), new T.MeshStandardMaterial({color:'#ffffff', roughness:.4})); ball.castShadow = !LOW_GFX; sc.add(ball);
    const shadow = new T.Mesh(new T.CircleGeometry(.3, 16), new T.MeshBasicMaterial({color:'#000', transparent:true, opacity:.35})); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .03; sc.add(shadow);
    const marker = new T.Mesh(new T.RingGeometry(.6, .85, 32), new T.MeshBasicMaterial({color:'#E8B730', side:T.DoubleSide})); marker.rotation.x = -Math.PI / 2; marker.position.y = .04; sc.add(marker);
    R3.s = {T, r, sc, cam, ball, shadow, marker, figs:new Map(), camPos:new T.Vector3(0, 32, 62), look:new T.Vector3(0, 0, 0), bz:0, last:performance.now(), key:null};
    return R3.s;
  });
}
function r3Players(S){
  const R = R3.s, T = R.T, key = S.players.length + ':' + S.teams.map(t => t.name).join('|');
  if (R.key === key) return;
  R.figs.forEach(f => R.sc.remove(f)); R.figs.clear(); R.key = key;
  const kits = [kitFor('Your XI home'), kitFor(String(S.teams[1].name || 'away'))];
  kits[0] = {a:'#0F1E33', b:'#E8B730', pat:''};
  if (/0f1e33|1a2b5a|1b2a7a/i.test(kits[1].a)) kits[1] = {a:'#f4f4f4', b:'#111', pat:''};
  S.players.forEach((p, i) => {
    const kit = p.slot === 'GK' ? {a:p.team ? '#22c55e' : '#f97316', b:'#111', pat:''} : kits[p.team];
    const f = makeFootballer(T, kit, {seed:i}); f.scale.setScalar(1.25); R.sc.add(f); R.figs.set(p, f);
  });
}
function r3Update(S, dtOverride){
  const R = R3.s; if (!R || !S) return;
  const st = $('#mo-stage'), w = st.clientWidth, h = st.clientHeight;
  if (R.w !== w || R.h !== h) { R.r.setSize(w, h, false); R.cam.aspect = w / h; R.cam.updateProjectionMatrix(); R.w = w; R.h = h; }
  r3Players(S);
  const now = performance.now(), dt = dtOverride !== undefined ? .016 : Math.min(.05, (now - R.last) / 1000); R.last = now;
  S.players.forEach(p => {
    const f = R.figs.get(p); if (!f) return;
    f.position.set(p.x - 52.5, 0, p.y - 34);
    const sp = Math.hypot(p.vx || 0, p.vy || 0);
    const ang = sp > .3 ? Math.atan2(p.vx, p.vy) : Math.atan2(p.fx || (p.team ? -1 : 1), p.fy || 0);
    let d = ang - f.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    f.rotation.y += d * Math.min(1, dt * 10);
    animateRun(f, sp, dt);
  });
  const b = S.ball, bs = Math.hypot(b.vx, b.vy);
  const targetZ = b.owner ? .25 : Math.min(2.6, .25 + Math.max(0, bs - 12) * .12);
  R.bz += (targetZ - R.bz) * Math.min(1, dt * 6);
  R.ball.position.set(b.x - 52.5, R.bz, b.y - 34); R.ball.rotation.x += bs * dt; R.shadow.position.set(b.x - 52.5, .03, b.y - 34);
  const c = S.ctl; R.marker.visible = !!(c && M && M.mode === 'play');
  if (c) R.marker.position.set(c.x - 52.5, .04, c.y - 34);
  // cameras: 0 broadcast, 1 high tactical, 2 behind your player
  const bx = b.x - 52.5, bz = b.y - 34; let cp, lk;
  if (R3.cam === 1) { cp = [bx * .6, 70, 34]; lk = [bx * .6, 0, 2]; }
  else if (R3.cam === 2 && c) { cp = [c.x - 52.5 - 16, 9, c.y - 34]; lk = [c.x - 52.5 + 10, 0, c.y - 34]; }
  else if (R.w < R.h) { cp = [bx, 20, bz + 30]; lk = [bx, 0, bz - 2]; }   // phones held upright: follow the ball closely
  else { cp = [Math.max(-34, Math.min(34, bx)) , 26, 58]; lk = [Math.max(-40, Math.min(40, bx)), 0, bz * .4]; }
  R.camPos.lerp(new R.T.Vector3(...cp), Math.min(1, dt * 2.5)); R.look.lerp(new R.T.Vector3(...lk), Math.min(1, dt * 3));
  R.cam.position.copy(R.camPos); R.cam.lookAt(R.look);
  R.r.render(R.sc, R.cam);
}
const _drawFrame13 = drawFrame;
drawFrame = function(){ if (R3.on && R3.s && M && M.S) return r3Update(M.S); return _drawFrame13(); };
const _drawIdle13 = drawIdle;
drawIdle = function(){
  if (R3.on && M) { const S = MX.create({home:M.home, away:M.away, mode:'sim'}); M.idleS = S; r3Ensure().then(() => { if (M && !M.S) r3Update(M.idleS, 0); }).catch(() => { R3.on = false; applyView(); }); return; }
  return _drawIdle13();
};
const _resizeCanvas13 = resizeCanvas;
resizeCanvas = function(){ _resizeCanvas13(); if (M && R3.on) M.vert = false; };  // the 3D camera always shows the pitch sideways
const _openMatch13 = openMatch;
openMatch = function(o){
  _openMatch13(o);
  const top = $('#match-ov .mo-meta');
  if (top && !$('#mo-3d') && hasWebGL) top.insertAdjacentHTML('beforeend', '<button class="mo-chip" id="mo-3d" onclick="r3Toggle()"></button><button class="mo-chip" id="mo-cam" onclick="r3Cam()">Camera</button>');
  applyView();
};
const _closeMatch13 = closeMatch;
closeMatch = function(){ _closeMatch13(); };

// ---------- Practice pitch: play a real match in 3D, any time ----------
function openPractice(){
  const full = squadFull();
  const home = full ? myTeamDef() : oppTeamDef('Your trainees', 72);
  home.name = 'Your XI';
  const str = full ? Math.max(55, teamScore().total - 2) : 70;
  M = {oppName:'Training squad', oppStr:str, title:'Practice match', practice:true, home, away:oppTeamDef('Training squad', str), reward:() => 0, onDone:() => {}};
  const ov = $('#match-ov'); ov.classList.add('open'); ov.classList.remove('playing'); document.body.style.overflow = 'hidden';
  ov.classList.toggle('touchmode', 'ontouchstart' in window || matchMedia('(pointer: coarse)').matches);
  $('#mo-home').textContent = 'Your XI'; $('#mo-away').textContent = 'Training squad';
  $('#mo-sc').textContent = '0 – 0'; $('#mo-clock').textContent = "0'"; $('#mo-mode').textContent = 'Practice'; $('#mo-actions').innerHTML = '';
  const top = $('#match-ov .mo-meta');
  if (top && !$('#mo-3d') && hasWebGL) top.insertAdjacentHTML('beforeend', '<button class="mo-chip" id="mo-3d" onclick="r3Toggle()"></button><button class="mo-chip" id="mo-cam" onclick="r3Cam()">Camera</button>');
  resizeCanvas(); applyView();
  showPre(`<div class="mo-panel"><div class="muted">Practice pitch</div><h2>Free training match</h2>
    <p>Take control of your team on a full pitch. Nothing counts here: no daily limit, no rewards, just practice.${full ? '' : ' Your eleven is not full yet, so you play with a trainee squad.'}</p>
    <p class="muted" style="font-size:13px">Move: arrows or WASD · Pass/tackle: Space · Shoot: F · Switch: Q. On phones use the stick and buttons.</p>
    <div class="nm-btns"><button class="btn btn-gold" onclick="startMatch('play')">Kick off</button><button class="btn btn-ghost" onclick="closeMatch()">Not now</button></div></div>`);
}

// ---------- Hub & tabs ----------
const _renderHome13 = renderHome;
renderHome = function(){
  _renderHome13();
  document.querySelectorAll('.hub-market').forEach(e => e.remove());
  const cupsTile = document.querySelector('.hub-cups');
  if (cupsTile) cupsTile.innerHTML = `<span class="ht-k">Daily cups</span><b>${CUPS.length} cups</b><span>${cupDone() ? 'Next entry tomorrow' : 'Free entry ready'}</span>`;
  const grid = cupsTile && cupsTile.parentElement;
  if (grid && !grid.querySelector('.hub-practice')) grid.insertAdjacentHTML('beforeend', `<button class="hub-tile hub-practice" onclick="openPractice()"><span class="ht-k">Practice pitch</span><b>3D</b><span>Play a free training match</span></button>`);
};
document.querySelectorAll('.tab[data-tab="market"]').forEach(b => b.remove());
document.querySelectorAll('.tab[data-tab="cups"] .tab-pill').forEach(p => { p.textContent = 'Daily'; });
if (G.career && !G.career.size && G.career.round === 0 && !G.career.done) newSeason(G.career.div, G.career.season);
