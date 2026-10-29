// =====================================================================
// FUTBOL MUNDO v16 — free monthly jersey giveaway (no purchase needed)
// =====================================================================
function openGiveaway(){
  const end = new Date(); end.setMonth(end.getMonth() + 1, 0);
  openInfo('Free jersey giveaway', `<p><b>Every month we give away a jersey.</b> Create a free Futbol Mundo account and you're in this month's draw. No purchase needed, and buying does not improve your chances.</p>
  <ul style="margin:10px 0 0 18px;line-height:1.6;font-size:14px">
  <li>One entry per person (one account per person).</li>
  <li>This month's draw closes on ${end.toLocaleDateString(undefined, {day:'numeric', month:'long', year:'numeric'})}. The winner is picked at random within 7 days and contacted by email.</li>
  <li>The winner picks one jersey from the shop, shipped free. No cash alternative.</li>
  <li>Open to people 18+ (or with a parent's permission) where giveaways like this are allowed. Void where prohibited.</li>
  <li>Run by Futbol Mundo. Not sponsored or endorsed by Instagram, Facebook or Meta.</li></ul>
  <div style="margin-top:16px">${ME.user ? '<b style="color:var(--pitch)">✓ You are entered this month.</b>' : '<button class="info-btn" onclick="closeInfo();openAuth(\'signup\', \'Sign up free to enter the monthly jersey giveaway.\')">Sign up and enter</button>'}</div>`);
}
// owner tool: draw a winner
async function drawGiveaway(){
  try { const j = await api('/api/admin?draw=' + new Date().toISOString().slice(0, 7)); openInfo('Giveaway draw', j.entries ? `${j.entries} entries in ${j.month}.<br><br>Winner: <b>${escapeHtml(j.winner)}</b><br><br>Email them to pick their jersey.` : 'No entries yet this month.'); } catch (e) { showToast(e.message); }
}
const _openAdmin16 = openAdmin;
openAdmin = async function(){ await _openAdmin16(); const b = $('#info-modal-body h3'); if (b && !$('#gw-draw')) b.insertAdjacentHTML('afterend', '<button class="btn btn-gold btn-sm" id="gw-draw" onclick="drawGiveaway()" style="margin:6px 0 10px">Draw this month\'s jersey giveaway winner</button>'); };
// deep link: futbolmundoshop.com/#giveaway
if (location.hash === '#giveaway') { let tries = 0; const t = setInterval(() => { if (!ME.ready && ++tries < 30) return; clearInterval(t); try { go('game'); } catch (e) {} if (!ME.user) openAuth('signup', 'Sign up free to enter the monthly jersey giveaway.'); else openGiveaway(); }, 300); }
