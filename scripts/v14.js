// =====================================================================
// FUTBOL MUNDO v14 — our own delivery form on the bag page: any country
// in the world, phone with its country code. Sent to PayPal so the card
// form opens with the right country, and saved with the order.
// =====================================================================
const DIAL = {AF:93,AL:355,DZ:213,AS:1,AD:376,AO:244,AI:1,AG:1,AR:54,AM:374,AW:297,AU:61,AT:43,AZ:994,BS:1,BH:973,BD:880,BB:1,BY:375,BE:32,BZ:501,BJ:229,BM:1,BT:975,BO:591,BA:387,BW:267,BR:55,BN:673,BG:359,BF:226,BI:257,KH:855,CM:237,CA:1,CV:238,KY:1,CF:236,TD:235,CL:56,CN:86,CO:57,KM:269,CG:242,CD:243,CK:682,CR:506,CI:225,HR:385,CU:53,CW:599,CY:357,CZ:420,DK:45,DJ:253,DM:1,DO:1,EC:593,EG:20,SV:503,GQ:240,ER:291,EE:372,SZ:268,ET:251,FK:500,FO:298,FJ:679,FI:358,FR:33,GF:594,PF:689,GA:241,GM:220,GE:995,DE:49,GH:233,GI:350,GR:30,GL:299,GD:1,GP:590,GU:1,GT:502,GG:44,GN:224,GW:245,GY:592,HT:509,HN:504,HK:852,HU:36,IS:354,IN:91,ID:62,IQ:964,IE:353,IM:44,IL:972,IT:39,JM:1,JP:81,JE:44,JO:962,KZ:7,KE:254,KI:686,XK:383,KW:965,KG:996,LA:856,LV:371,LB:961,LS:266,LR:231,LY:218,LI:423,LT:370,LU:352,MO:853,MG:261,MW:265,MY:60,MV:960,ML:223,MT:356,MH:692,MQ:596,MR:222,MU:230,YT:262,MX:52,FM:691,MD:373,MC:377,MN:976,ME:382,MS:1,MA:212,MZ:258,MM:95,NA:264,NR:674,NP:977,NL:31,NC:687,NZ:64,NI:505,NE:227,NG:234,NU:683,MK:389,MP:1,NO:47,OM:968,PK:92,PW:680,PS:970,PA:507,PG:675,PY:595,PE:51,PH:63,PL:48,PT:351,PR:1,QA:974,RE:262,RO:40,RU:7,RW:250,BL:590,SH:290,KN:1,LC:1,MF:590,PM:508,VC:1,WS:685,SM:378,ST:239,SA:966,SN:221,RS:381,SC:248,SL:232,SG:65,SX:1,SK:421,SI:386,SB:677,SO:252,ZA:27,KR:82,SS:211,ES:34,LK:94,SD:249,SR:597,SE:46,CH:41,TW:886,TJ:992,TZ:255,TH:66,TL:670,TG:228,TO:676,TT:1,TN:216,TR:90,TM:993,TC:1,TV:688,UG:256,UA:380,AE:971,GB:44,US:1,UY:598,UZ:998,VU:678,VA:39,VE:58,VN:84,VG:1,VI:1,WF:681,YE:967,ZM:260,ZW:263,BQ:599,AX:358,SJ:47};
const COUNTRY_NAMES = (() => {
  let dn = null; try { dn = new Intl.DisplayNames([(window.I18N && I18N.lang) || 'en', 'en'], {type:'region'}); } catch (e) {}
  return Object.keys(DIAL).map(c => [c, (dn && dn.of(c)) || c]).sort((a, b) => a[1].localeCompare(b[1]));
})();
const ADDR_F = ['name', 'phone', 'line1', 'line2', 'city', 'state', 'zip'];
function addrGet(){ let a = {}; try { a = JSON.parse(localStorage.getItem('fm_addr') || '{}') || {}; } catch (e) {} return a; }
function addrSet(a){ try { localStorage.setItem('fm_addr', JSON.stringify(a)); } catch (e) {} COADDR = a; }
let COADDR = addrGet();
function guessCountry(){
  if (COADDR.country) return COADDR.country;
  const c = (window.GEO_COUNTRY || '').toUpperCase(); return DIAL[c] ? c : '';
}
function addrInput(e){
  const a = Object.assign({}, COADDR); a[e.target.dataset.k] = e.target.value;
  if (e.target.dataset.k === 'country') { const d = DIAL[a.country]; const ph = $('#ad-phone'); if (d && ph && (!ph.value || /^\+\d{0,4}\s?$/.test(ph.value))) { ph.value = '+' + d + ' '; a.phone = ph.value; } }
  addrSet(a); e.target.classList.remove('err');
}
function addrHTML(){
  const a = COADDR, cc = guessCountry();
  const f = (k, label, ph, extra = '') => `<label class="ad-f ad-${k}"><span>${label}</span><input id="ad-${k}" data-k="${k}" value="${escapeAttr(a[k] || (k === 'phone' && cc && DIAL[cc] ? '+' + DIAL[cc] + ' ' : ''))}" placeholder="${ph}" oninput="addrInput(event)" ${extra}></label>`;
  return `<h2 class="co-h2">Delivery details</h2><div class="ad-grid">
    ${f('name', 'Full name', 'First and last name', 'autocomplete="name"')}
    <label class="ad-f ad-country"><span>Country</span><select id="ad-country" data-k="country" onchange="addrInput(event)" autocomplete="country"><option value="">Choose your country</option>${COUNTRY_NAMES.map(([c, n]) => `<option value="${c}"${c === cc ? ' selected' : ''}>${escapeHtml(n)}</option>`).join('')}</select></label>
    ${f('phone', 'Phone (with country code)', '+1 555 123 4567', 'type="tel" autocomplete="tel" inputmode="tel"')}
    ${f('line1', 'Address', 'Street and house number', 'autocomplete="address-line1"')}
    ${f('line2', 'Apartment, floor (optional)', '', 'autocomplete="address-line2"')}
    ${f('city', 'City', '', 'autocomplete="address-level2"')}
    ${f('state', 'State / region (if any)', '', 'autocomplete="address-level1"')}
    ${f('zip', 'Postal code (if any)', '', 'autocomplete="postal-code"')}
  </div><p class="ad-note">We ship worldwide. The courier may call this number about your delivery.</p>`;
}
const needsAddr = () => merchTotal(cart) > 0;
function coAddrData(){
  if (!needsAddr()) return null;
  const a = Object.assign({}, COADDR); if (!a.country) a.country = guessCountry();
  return {name:(a.name || '').trim(), phone:(a.phone || '').trim(), line1:(a.line1 || '').trim(), line2:(a.line2 || '').trim(), city:(a.city || '').trim(), state:(a.state || '').trim(), zip:(a.zip || '').trim(), country:a.country || ''};
}
function coAddrValid(){
  const a = coAddrData(); if (!a) return true;
  const bad = !a.name || a.name.length < 3 ? 'name' : !a.country ? 'country' : (a.phone.replace(/\D/g, '').length < 7) ? 'phone' : a.line1.length < 3 ? 'line1' : a.city.length < 2 ? 'city' : '';
  if (!bad) return true;
  const el = $('#ad-' + bad); if (el) { el.classList.add('err'); el.scrollIntoView({block:'center', behavior:'smooth'}); setTimeout(() => el.focus(), 300); }
  showToast({name:'Enter your full name', country:'Choose your country', phone:'Enter a phone number with the country code', line1:'Enter your street address', city:'Enter your city'}[bad]);
  return false;
}
const _renderCheckout14 = renderCheckout;
renderCheckout = function(){
  _renderCheckout14();
  let w = $('#co-addr-wrap');
  if (!w) { const after = $('#co-ship-wrap') || $('#co-cart-items'); after.insertAdjacentHTML('afterend', '<div id="co-addr-wrap"></div>'); w = $('#co-addr-wrap'); }
  if (!needsAddr()) { w.innerHTML = ''; return; }
  if (!w.querySelector('.ad-grid')) w.innerHTML = addrHTML();
};
// geo hint for the default country
fetch('/api/geo').then(r => r.json()).then(j => { window.GEO_COUNTRY = j.country || ''; }).catch(() => {});
// redirect buttons: check the form first
const _startStripe14 = startStripeCheckout;
startStripeCheckout = function(method){ if (!coAddrValid()) return; return _startStripe14(method); };
