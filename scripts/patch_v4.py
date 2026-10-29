import re, sys
P = '/home/claude/futbol-mundo-store/index.html'
s = open(P, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        sys.exit(f'expected {count} of {old[:80]!r}, found {n}')
    s = s.replace(old, new)

def rep_between(start, end, new):
    global s
    a = s.index(start); b = s.index(end, a)
    s = s[:a] + new + s[b:]

# ---------- copy ----------
rep('<div class="notice"><b>Every shirt unlocks a player.</b> Your order includes a one-time Mundo XI code for each jersey. Free shipping over $99.</div>',
    '<div class="notice"><b>Every shirt comes with a 6-player Mundo XI pack.</b> Free club scarf + bonus player on orders over $30. Free shipping over $99.</div>')
rep('Each one comes with a one-time code that unlocks that player in Mundo XI, our collect-and-trade game with a grand prize at the end of the season.',
    'Every shirt comes with a 6-player pack for Mundo XI, our collect-and-trade football game with a grand prize at the end of the season.')
rep('<span>Choose a player on the jersey, or let a mystery box surprise you. You get one code per shirt.</span>',
    '<span>Every shirt brings 4,000 points: one 6-player Gold pack. Orders over $30 add a free club scarf and a bonus player.</span>')
rep('<span>Shirt codes unlock that player. Box codes unlock packs. Big players arrive with a walkout.</span>',
    '<span>Your codes land in your game. Open packs and watch big signings walk out. Try squad building with free demo players first.</span>')
rep('<span>Start in Division 10. Play matches yourself or watch them on fast-forward, win cups and get promoted.</span>',
    '<span>With 11 real players you start in Division 10. Play matches yourself or on fast-forward, win cups and get promoted.</span>')
rep('''<button class="btn btn-ghost" onclick="go('game','redeem')">Redeem a code</button></div>''',
    '''<button class="btn btn-ghost" onclick="go('game','squad')">Build a demo squad</button></div>''')
rep('Every box comes with a pack code: open it in Mundo XI to reveal the players inside, FIFA style.',
    'Every shirt in the box comes with its own 6-player Mundo XI pack.')
rep('''{n:1, name:'Debut',     price:35.98, perks:['1 surprise jersey','Debut pack: 1 shirt player + 2 bonus cards']},''',
    '''{n:1, name:'Debut',     price:35.98, perks:['1 surprise jersey','1 six-player Mundo XI pack','Free club scarf + bonus player']},''')
rep('''perks:['2 jerseys, 2 different teams','Brace pack: 2 shirt players + 2 bonus cards']},''',
    '''perks:['2 jerseys, 2 different teams','2 six-player packs: 12 players, enough to play','Free club scarf + bonus player']},''')
rep('''perks:['3 jerseys, 3 different teams','Hat-trick pack: 3 shirt players + 3 bonus cards','At least 1 Elite player (85+)'], featured:true},''',
    '''perks:['3 jerseys, 3 different teams','3 six-player packs: 18 players','Free club scarf + bonus player'], featured:true},''')
rep('''perks:['4 jerseys incl. 1 retro classic','Póker pack: 4 shirt players + 3 bonus cards','1 Elite player guaranteed']},''',
    '''perks:['4 jerseys incl. 1 retro classic','4 six-player packs: 24 players','Free club scarf + bonus player']},''')
rep('''perks:['5 jerseys incl. 1 retro classic','Manita pack: 5 shirt players + 4 bonus cards','1 Icon guaranteed, with walkout']},''',
    '''perks:['5 jerseys incl. 1 retro classic','5 six-player packs: 30 players','Free club scarf + bonus player']},''')
rep("const RULES_TEXT = 'One code per shirt, each code redeemable once. Mystery boxes come with a pack code.",
    "const RULES_TEXT = 'Every shirt comes with a one-time code worth 4,000 points, enough for one 6-player Gold pack. Mystery boxes include one code per shirt. Orders over $30 include a free club scarf and a code for a bonus player. Every manager can build a demo squad with gray DEMO players, but matches and cups need 11 real players. Gifts unlock after $30 spent in the shop.")
rep("Every new manager gets a free starter pack and begins in Division 10.", "Managers begin in Division 10.")
rep('''${p.shirt ? '<div class="xi">+ Mundo XI player code</div>' : ''}''', '''${p.shirt ? '<div class="xi">+ 6-player Mundo XI pack</div>' : ''}''')
rep('''    ? 'Includes a one-time Mundo XI code for the player you choose below.'
    : 'Includes a one-time Mundo XI code. Add a name and number to pick your player.';''',
    '''    ? 'Includes a 6-player Mundo XI pack (4,000 points). Orders over $30 add a free scarf + bonus player.'
    : 'Includes a 6-player Mundo XI pack (4,000 points). Orders over $30 add a free scarf + bonus player.';''')
rep('<span id="pdp-perk-txt">Includes a one-time Mundo XI code for the player you choose.</span>',
    '<span id="pdp-perk-txt">Includes a 6-player Mundo XI pack.</span>')
rep('<div class="f-bot"><span>© 2026 Futbol Mundo</span><span>Secure checkout · Card, PayPal, Apple Pay, Google Pay</span></div>',
    '<div class="f-bot"><span>© 2026 Futbol Mundo</span><span>Secure checkout by Stripe · Card, Apple Pay, Google Pay</span></div>')
rep('support@futbolmundo.com', 'support@futbolmundoshop.com')
rep("<p>Every shirt comes with a code for that player. Mystery boxes come with a pack code. Each code works once.</p>",
    "<p>Codes from your order confirmation. Shirt codes add 4,000 points (a 6-player pack); scarf codes add a bonus player. Each code works once per device.</p>")
rep('<input id="code-in" placeholder="MX-XXXX-XXXX" maxlength="14"', '<input id="code-in" placeholder="MX-P014-XXXX-XXXXXXXX" maxlength="24"')
rep('''<p style="margin:12px 0 0;font-size:14px">No code yet? Try a demo <button class="link" onclick="demoCode()">shirt code</button> or <button class="link" onclick="demoCode('box3')">mystery box code</button>.</p>''',
    '''<p style="margin:12px 0 0;font-size:14px">No code yet? Every jersey comes with one. <button class="link" onclick="go('shop')">Shop jerseys</button></p>''')
rep('''onclick="autoPick()">${G.cards.length ? 'Pick my best eleven' : 'Open your starter pack'}</button>''', '''onclick="autoPick()">Pick my best eleven</button>''')
rep('<p class="muted" style="font-size:14px;margin-bottom:16px">You need all 11 places filled to play.',
    '<p class="muted" style="font-size:14px;margin-bottom:16px">Gray cards are demo players: build with them, but matches need 11 real players.')

# fresh save key so every visitor starts in demo mode
rep("store.get('fm_xi', {})", "store.get('fm_xi2', {})")
rep("store.set('fm_xi', G)", "store.set('fm_xi2', G)")

# ---------- checkout markup ----------
rep('''<div class="co-step-dot" data-step="2"><span class="num"><span>2</span></span><span class="lbl">Shipping</span></div>
      <div class="co-step-dot" data-step="3"><span class="num"><span>3</span></span><span class="lbl">Payment</span></div>
      <div class="co-step-dot" data-step="4"><span class="num"><span>4</span></span><span class="lbl">Done</span></div>''',
    '''<div class="co-step-dot" data-step="2"><span class="num"><span>2</span></span><span class="lbl">Pay securely</span></div>
      <div class="co-step-dot" data-step="4"><span class="num"><span>3</span></span><span class="lbl">Done</span></div>''')
rep('''        <div class="co-promo">
          <input class="co-input" id="promo-code" placeholder="Promo code" autocomplete="off">
          <button class="co-btn-secondary" onclick="applyPromo()">Apply</button>
        </div>
        <div class="co-actions">
          <span></span>
          <button class="co-btn-primary" onclick="goToStep(2)">Continue to Shipping →</button>
        </div>''',
    '''        <div class="co-actions">
          <span class="co-stripe-note">Shipping, payment and promo codes on the next page, secured by Stripe.</span>
          <button class="co-btn-primary" id="co-go" onclick="startStripeCheckout()">Continue to secure checkout →</button>
        </div>''')
rep_between('      <!-- STEP 2 — Shipping -->', '      <!-- STEP 4 — Confirmation -->', '')
rep('''      <div class="co-sum-row" id="co-sum-promo-row" style="display:none"><span style="color:#34c759">Promo</span><span id="co-sum-promo" style="color:#34c759">−$0.00</span></div>
      <div class="co-sum-row"><span>Shipping</span><span id="co-sum-ship">—</span></div>
      <div class="co-sum-row"><span>Estimated tax</span><span id="co-sum-tax">$0.00</span></div>
      <div class="co-sum-row total"><span>Total</span><span id="co-sum-total">$0.00</span></div>''',
    '''      <div class="co-sum-row"><span>Shipping</span><span id="co-sum-ship">—</span></div>
      <div class="co-sum-row total"><span>Total before shipping</span><span id="co-sum-total">$0.00</span></div>''')

# ---------- move init into v4 ----------
rep('''// ---------------- Init ----------------
cart = store.get('fm_cart', []);
renderCart();
updateWishCount();
renderHero(); renderPicks(); renderBest(); renderRetro(); renderBoxes(); renderLeagueTiles(); renderPrize();
checkCups();
routeFromHash();
''', '// (init moved to the v4 script below)\n')

css = open('/home/claude/futbol-mundo-store/scripts/v4.css', encoding='utf-8').read()
js = open('/home/claude/futbol-mundo-store/scripts/v4.js', encoding='utf-8').read()
rep('</head>', '<style>\n' + css + '\n</style>\n</head>')
rep('</body>', '<script>\n' + js + '\n</script>\n</body>')
open(P, 'w', encoding='utf-8').write(s)
print('patched', len(s))
