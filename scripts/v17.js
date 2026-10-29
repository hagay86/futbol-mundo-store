// =====================================================================
// FUTBOL MUNDO v17 — game cards use drawn avatars instead of photos:
// weak/academy players get a plain shirt, real players a kit-coloured avatar.
// =====================================================================
function shirtAvatarSVG(num, a = '#9aa3ad', b = '#ffffff'){
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M30 18l12-5h16l12 5 18 14-9 14-9-5v46H30V41l-9 5-9-14z" fill="${a}" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/><path d="M42 13q8 8 16 0" fill="none" stroke="${b}" stroke-width="3"/><text x="50" y="66" text-anchor="middle" font-family="Barlow Condensed,Arial Black,Arial" font-weight="800" font-size="26" fill="${b}">${num || ''}</text></svg>`;
}
function playerAvatarSVG(c){
  const kit = kitFor(c.team), h = hash(c.player || 'x');
  const skins = ['#f1c27d','#e0ac69','#c68642','#8d5524','#ffdbac','#a86b3c'], hairs = ['#1a1209','#3b2412','#6b4423','#111','#d6b370','#2b1b10'];
  const skin = skins[h % skins.length], hair = hairs[(h >>> 3) % hairs.length], style = (h >>> 6) % 5, beard = ((h >>> 9) % 4) === 0;
  const id = 'k' + (h % 100000);
  const stripes = kit.pat === 'stripes' ? `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${kit.a}"/><rect width="5" height="12" fill="${kit.b}"/></pattern>` : kit.pat === 'checks' ? `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${kit.a}"/><rect width="6" height="6" fill="${kit.b}"/><rect x="6" y="6" width="6" height="6" fill="${kit.b}"/></pattern>` : '';
  const fill = stripes ? `url(#${id})` : kit.a;
  const hairPath = [
    `<path d="M33 40q0-20 17-20t17 20q-4-9-17-9t-17 9z" fill="${hair}"/>`,
    `<path d="M34 38q1-17 16-17t16 17q-3-5-16-6t-16 6z" fill="${hair}"/>`,
    `<g fill="${hair}"><circle cx="38" cy="30" r="6"/><circle cx="46" cy="25" r="6.5"/><circle cx="55" cy="25" r="6.5"/><circle cx="62" cy="30" r="6"/><circle cx="35" cy="37" r="4.5"/><circle cx="65" cy="37" r="4.5"/></g>`,
    `<path d="M32 46q-2-26 18-26t18 26q-2-12-6-14-6 4-12 2-6 2-12-2-4 2-6 14z" fill="${hair}"/>`,
    `<path d="M35 34q4-12 15-12t15 12z" fill="${hair}" opacity=".85"/>`,
  ][style];
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs>${stripes}</defs>
    <path d="M8 100q2-24 22-30l10-3h20l10 3q20 6 22 30z" fill="${fill}" stroke="rgba(0,0,0,.15)" stroke-width="1"/>
    <path d="M40 67l10 11 10-11" fill="none" stroke="${kit.pat ? '#fff' : kit.b}" stroke-width="3"/>
    <text x="68" y="92" text-anchor="middle" font-family="Barlow Condensed,Arial Black,Arial" font-weight="800" font-size="13" fill="${kit.pat ? '#fff' : kit.b}">${c.num || ''}</text>
    <rect x="44" y="56" width="12" height="13" rx="4" fill="${skin}"/>
    <ellipse cx="34.5" cy="44" rx="3" ry="4.5" fill="${skin}"/><ellipse cx="65.5" cy="44" rx="3" ry="4.5" fill="${skin}"/>
    <ellipse cx="50" cy="42" rx="15" ry="18" fill="${skin}"/>
    ${beard ? `<path d="M36 46q2 16 14 17t14-17q-4 8-14 8t-14-8z" fill="${hair}" opacity=".9"/>` : ''}
    <ellipse cx="44" cy="42" rx="1.9" ry="2.3" fill="#1b1b1b"/><ellipse cx="56" cy="42" rx="1.9" ry="2.3" fill="#1b1b1b"/>
    <path d="M40.5 37.5l6-1M53.5 36.5l6 1" stroke="${hair}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M46 52q4 2.5 8 0" fill="none" stroke="#7a3b2e" stroke-width="1.4" stroke-linecap="round"/>
    ${hairPath}</svg>`;
}
const isWeak = c => c.rookie || c.noob || c.rating < 55 || /academy/i.test(c.team || '');
function avatarFor(c){ return isWeak(c) ? shirtAvatarSVG(c.num) : playerAvatarSVG(c); }
const _cardHTML17 = cardHTML;
cardHTML = function(c){
  const html = _cardHTML17(c);
  if (c.item) return html;
  return html.replace(/<div class="fut-img"><img [^>]*><\/div>/, `<div class="fut-img fut-av">${avatarFor(c)}</div>`)
             .replace(/<div class="shirt"><img [^>]*><\/div>/, `<div class="shirt fut-av">${avatarFor(c)}</div>`);
};
