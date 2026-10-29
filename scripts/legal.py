import datetime
UPDATED = "29 October 2026"
OP = "Hagay Dardik, an individual business registered in Israel, trading as “Futbol Mundo”"
EMAIL = "hagaydardik@gmail.com"
SITE = "futbolmundoshop.com"
NAV = [("terms.html","Terms of Service"),("privacy.html","Privacy Policy"),("returns.html","Shipping & Returns"),("giveaway.html","Giveaway Rules"),("accessibility.html","Accessibility")]
def page(fname, title, body):
    nav = " · ".join(f'<a href="/legal/{f}"{" class=on" if f==fname else ""}>{t}</a>' for f,t in NAV)
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Futbol Mundo</title><meta name="robots" content="index,follow"><link rel="icon" href="/favicon.ico">
<link rel="canonical" href="https://www.{SITE}/legal/{fname}">
<style>:root{{--ink:#0F1E33;--gold:#E8B730;--muted:#4A5668}}*{{box-sizing:border-box}}body{{margin:0;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:#F4F6F3}}
header{{background:var(--ink);color:#fff;padding:16px}}header a{{color:#fff;text-decoration:none;font-weight:800;letter-spacing:1px}}header a span{{color:var(--gold)}}
main{{max-width:820px;margin:0 auto;padding:28px 16px 60px;background:#fff}}h1{{font-size:32px;line-height:1.15;margin:0 0 6px}}h2{{font-size:21px;margin:34px 0 8px}}h3{{font-size:17px;margin:22px 0 6px}}
.upd{{color:var(--muted);font-size:14px}}nav{{font-size:14px;margin:14px 0 18px;line-height:2}}nav a{{color:#17804F}}nav a.on{{font-weight:700;color:var(--ink)}}
.box{{background:#FFF8E1;border-left:4px solid var(--gold);padding:12px 14px;margin:16px 0;font-size:15px}}li{{margin:4px 0}}a{{color:#17804F}}
footer{{max-width:820px;margin:0 auto;padding:18px 16px;color:var(--muted);font-size:13px}}</style></head>
<body><header><a href="/">FUTBOL <span>MUNDO</span></a></header><main><h1>{title}</h1><div class="upd">Last updated: {UPDATED}</div><nav>{nav}</nav>{body}</main>
<footer>© 2026 Futbol Mundo · <a href="/">Back to the store</a> · Contact: <a href="mailto:{EMAIL}">{EMAIL}</a></footer></body></html>'''

TERMS = f'''
<div class="box"><b>Please read these Terms carefully.</b> By using {SITE}, creating an account, playing Mundo XI or placing an order, you agree to be bound by these Terms of Service, our <a href="/legal/privacy.html">Privacy Policy</a>, our <a href="/legal/returns.html">Shipping &amp; Returns Policy</a> and, where relevant, the <a href="/legal/giveaway.html">Giveaway Rules</a>. If you do not agree, do not use the site. Section 17 limits our liability and Section 19 sets the governing law and courts.</div>

<h2>1. Who we are</h2>
<p>The website {SITE} (the “Site”), the online store and the Mundo XI game (together, the “Services”) are operated by {OP} (“Futbol Mundo”, “we”, “us”, “our”). You can contact us at <a href="mailto:{EMAIL}">{EMAIL}</a>. Our full business details (business name, registration number and business address) are available on request at the same address and will be shown on every tax invoice.</p>

<h2>2. Definitions</h2>
<ul><li><b>“You”, “Customer”, “User”</b> means any person who visits the Site, creates an account, plays Mundo XI or buys a product.</li>
<li><b>“Products”</b> means the physical goods offered in the store, including jerseys, kits, mystery boxes and accessories.</li>
<li><b>“Mundo XI”</b> or the <b>“Game”</b> means the football card game available on the Site, including player cards, packs, leagues, cups, the practice pitch and all related features.</li>
<li><b>“Mundo Credits”</b> (Ɱ) means the virtual in-game currency used inside Mundo XI.</li>
<li><b>“Virtual Items”</b> means player cards, packs, Mundo Credits, codes, trophies and any other digital item inside the Game.</li></ul>

<h2>3. Eligibility and accounts</h2>
<p>You must be at least 18 years old, or have the consent and supervision of a parent or legal guardian who agrees to these Terms on your behalf, to buy products or create an account. You must give accurate information and keep it up to date. You are responsible for keeping your password secret and for all activity under your account. One person may hold only one account. Tell us immediately at <a href="mailto:{EMAIL}">{EMAIL}</a> if you believe your account has been used without permission. We may refuse, suspend or close any account at our discretion, including where we reasonably suspect fraud, abuse, cheating or a breach of these Terms.</p>

<h2>4. The products we sell</h2>
<p>We sell football-themed apparel and accessories, including fan-version jerseys. <b>Unless a product page expressly says otherwise, products are not official licensed merchandise</b> and are not made, sponsored, endorsed or approved by any football club, league, federation, national team, player, kit manufacturer or other rights holder. Names of clubs, competitions, players and brands appear on the Site only to describe the design or team a product relates to. All trademarks belong to their respective owners.</p>
<p>We try to show products accurately, but colours, sizes, badges, sponsor logos, patches, fonts and materials may differ slightly from the photos, which may be supplied by our suppliers. Sizes follow the supplier's measurements and may vary by 1–3 cm. Please check the size guide before ordering. Mystery boxes contain randomly selected items within the chosen size and preference; you cannot choose or exchange the specific items for reasons of taste.</p>

<h2>5. Prices and payment</h2>
<p>Prices are shown in US dollars (USD) and include the amounts shown at checkout for the product, any chosen customisation (name, number, patches) and shipping. Prices, promotions and availability may change at any time before you place an order. If a price is clearly wrong because of an obvious error, we may cancel the order and refund you in full.</p>
<p>Payments are processed by PayPal (including card payments processed by PayPal). We never see or store your full card number. Your payment is also subject to PayPal's own terms and policies. Your bank or card issuer may charge currency conversion or foreign transaction fees, which are your responsibility.</p>
<p><b>Customs, import duties and taxes</b> charged by your country on delivery are not included in our prices and are payable by you, unless we state otherwise in writing. If you refuse to pay them and the parcel is returned, we may deduct the return shipping and charges from any refund.</p>

<h2>6. Orders and contract</h2>
<p>Your order is an offer to buy. A contract is formed only when your payment is completed and we send or display an order confirmation. We may refuse or cancel any order (with a full refund) if the product is unavailable, if we cannot deliver to your address, if we suspect fraud, or if the order breaches these Terms. You must give a complete and accurate delivery address and phone number; we are not responsible for delays or losses caused by incorrect details.</p>

<h2>7. Shipping, cancellation and returns</h2>
<p>Shipping, cancellation, returns and refunds are governed by our <a href="/legal/returns.html">Shipping &amp; Returns Policy</a>, which forms part of these Terms. Nothing in these Terms limits any right you have under mandatory consumer protection law, including the Israeli Consumer Protection Law, 5741-1981, and its regulations on distance selling.</p>

<h2>8. Personalised products</h2>
<p>Products printed with a name, number or patches you choose are made to your specification. To the extent permitted by law, personalised products cannot be cancelled or returned once production has started, except if they are defective or not as ordered. You are responsible for checking the spelling of names and numbers. You must not request printing that is offensive, unlawful or infringes anyone's rights; we may refuse such requests.</p>

<h2>9. Mundo XI: the game</h2>
<p>Mundo XI is provided for entertainment. You can play it for free. Some features or Virtual Items may be unlocked with codes that come with purchases in the store. <b>Buying a product is never required to play</b> and does not guarantee any result in the Game.</p>
<ul><li><b>No ownership.</b> Virtual Items, including Mundo Credits, are a limited, personal, revocable, non-transferable licence to use them inside the Game. They are not your property, have <b>no monetary value</b>, cannot be redeemed for cash or refunded, and cannot be sold, traded or transferred outside the Game.</li>
<li><b>Mundo Credits are not sold.</b> Mundo Credits can only be earned in the Game or received through codes. They are not money, a deposit, a stored-value product or a payment instrument.</li>
<li><b>Changes.</b> We may change, balance, reset, remove or discontinue any part of the Game, including ratings, packs, odds, rewards, leagues, cups and Virtual Items, at any time, with or without notice, and without liability, except as required by law.</li>
<li><b>Player data.</b> Player names and ratings are used for gameplay only. Ratings are our approximations and may differ from any official or third-party rating. The Game is not affiliated with, endorsed or sponsored by EA SPORTS, FIFA, FIFPRO, any league, club or player. Player avatars are illustrations and are not intended to depict real people.</li>
<li><b>Fair play.</b> You must not cheat, exploit bugs, use bots, scripts or modified clients, manipulate saves, create multiple accounts, or interfere with the Game or other users. We may remove Virtual Items, reset progress, disqualify you from rewards or close your account if we reasonably believe you did.</li>
<li><b>Codes.</b> Each code can be redeemed once, by the account it was issued to, and has no cash value. Lost, stolen or expired codes may not be replaced.</li>
<li><b>Saves.</b> Game progress may be stored on your device and in our database. We do not guarantee that progress will never be lost.</li></ul>

<h2>10. Gifts, rewards and prizes</h2>
<p>Gifts, rewards and prizes offered in the Game or on the Site (including the gift shop, cup and league rewards, the grand prize and the monthly giveaway) are subject to the specific conditions shown with them, availability, eligibility checks and the <a href="/legal/giveaway.html">Giveaway Rules</a> where relevant. We may require proof of identity, age and eligibility before delivering a prize. Prizes have no cash alternative unless required by law, and we may substitute a prize of similar or greater value. Winners are responsible for any taxes on prizes. Physical gifts are delivered only to the countries we ship to. We may withhold a reward if we reasonably suspect cheating or abuse.</p>

<h2>11. Acceptable use</h2>
<p>You must not: use the Services for any unlawful purpose; attempt to gain unauthorised access to any part of the Services or other accounts; scrape, copy or harvest data or content; reverse engineer the Game; upload malware; place fraudulent orders or make chargebacks without good reason; harass other users or our staff; or use the Services in any way that could damage, disable or overburden them.</p>

<h2>12. Intellectual property</h2>
<p>The Site's design, text, code, graphics, the Mundo XI name and game design, avatars and other original content belong to us or our licensors and are protected by law. You may use them only to shop and play for your personal, non-commercial use. Third-party names and marks belong to their owners and are used for identification only. If you believe content on the Site infringes your rights, write to <a href="mailto:{EMAIL}">{EMAIL}</a> with details of the work, the content and your contact information, and we will review and, where appropriate, remove it promptly.</p>

<h2>13. Promotions and marketing</h2>
<p>Discounts and promotions apply only as stated, cannot be combined unless stated, and may end at any time. We may send you service emails about your account and orders. We will send marketing messages only where the law allows, and you can opt out at any time.</p>

<h2>14. Third-party services</h2>
<p>The Services rely on third parties such as PayPal (payments), Vercel (hosting), Upstash (database), Resend (email), and content delivery networks. Their services are subject to their own terms. We are not responsible for their acts, omissions or outages, though we will try to help resolve any problem affecting your order.</p>

<h2>15. Availability</h2>
<p>We aim to keep the Services available but do not promise that they will be uninterrupted, timely, secure or error-free. We may suspend the Services for maintenance, updates or reasons outside our control.</p>

<h2>16. Disclaimers</h2>
<p>To the maximum extent permitted by law, the Services, the Game and all content are provided “as is” and “as available”, without warranties of any kind, express or implied, including fitness for a particular purpose, merchantability and non-infringement. This does not affect any warranty or right you have under mandatory consumer law, including your rights for defective products.</p>

<h2>17. Limitation of liability</h2>
<p>To the maximum extent permitted by law: (a) we are not liable for any indirect, incidental, special, consequential or punitive damages, or for loss of profits, revenue, data, goodwill or Virtual Items; and (b) our total liability arising out of or relating to the Services or any order is limited to the amount you actually paid us for the order giving rise to the claim, or USD 100 if the claim does not relate to an order. Nothing in these Terms excludes or limits liability that cannot be excluded or limited by law, including liability for death or personal injury caused by negligence, or for fraud.</p>

<h2>18. Indemnity</h2>
<p>To the extent permitted by law, you agree to indemnify us against claims, losses and reasonable costs (including legal fees) arising from your breach of these Terms, your misuse of the Services, or your violation of any law or third-party right.</p>

<h2>19. Governing law and disputes</h2>
<p>These Terms are governed by the laws of the State of Israel, without regard to conflict-of-law rules. The competent courts of Tel Aviv-Jaffa, Israel, have exclusive jurisdiction over any dispute, except that if you are a consumer living in another country you may also have the right to bring a claim in your local courts and to rely on the mandatory consumer protection laws of your country. Before starting legal proceedings, please contact us at <a href="mailto:{EMAIL}">{EMAIL}</a> so we can try to resolve the issue informally within 30 days.</p>

<h2>20. Changes to these Terms</h2>
<p>We may update these Terms from time to time. The version shown on the Site when you place an order applies to that order. For other uses, changes take effect when published; if you continue to use the Services after that, you accept the updated Terms. We will notify registered users of significant changes by email or on the Site.</p>

<h2>21. General</h2>
<p>If any part of these Terms is found invalid or unenforceable, the rest remains in force. Our failure to enforce a right is not a waiver. You may not transfer your rights under these Terms without our consent; we may transfer ours to a successor business. These Terms, together with the policies they refer to, are the entire agreement between you and us about the Services. If these Terms are translated, the English version prevails to the extent permitted by law.</p>

<h2>22. Contact</h2>
<p>Futbol Mundo · Email: <a href="mailto:{EMAIL}">{EMAIL}</a> · Website: https://www.{SITE}</p>
'''

PRIVACY = f'''
<div class="box">This Privacy Policy explains what personal data we collect, why, who we share it with and what rights you have. It applies to {SITE}, the online store and the Mundo XI game. The data controller is {OP} (“Futbol Mundo”, “we”). Contact: <a href="mailto:{EMAIL}">{EMAIL}</a>.</div>

<h2>1. Data we collect</h2>
<h3>Data you give us</h3>
<ul><li><b>Account:</b> email address, optional manager name and password (stored only as a secure one-way hash).</li>
<li><b>Orders:</b> items, sizes, chosen customisation (names, numbers, patches), delivery name, address, country and phone number, order history and amounts.</li>
<li><b>Support and giveaways:</b> messages you send us and information needed to verify and deliver prizes.</li></ul>
<h3>Data collected automatically</h3>
<ul><li><b>Technical data:</b> IP address, approximate country (used to choose the site language and default delivery country), browser and device type, pages and error logs, collected by our hosting provider for security and operation.</li>
<li><b>Game data:</b> your Mundo XI progress (cards, squad, results, Mundo Credits, codes redeemed), stored on your device and, when you are signed in, in our database.</li>
<li><b>Cookies and local storage:</b> a secure session cookie that keeps you signed in, and local storage on your device for your bag, wishlist, language, delivery details and game save. We do not use advertising cookies or sell your data. See section 8.</li></ul>
<h3>Data from third parties</h3>
<ul><li><b>PayPal</b> sends us payment confirmations, the payer's email and, where applicable, the shipping address. We never receive your full card number.</li></ul>

<h2>2. Why we use your data and our legal bases</h2>
<ul><li><b>To provide your account, the store and the Game, and to process and deliver orders</b> (performance of a contract).</li>
<li><b>To send service emails</b> such as order confirmations, game codes, password resets and order updates (contract).</li>
<li><b>To prevent fraud, cheating and abuse, and to keep the Services secure</b> (legitimate interests; legal obligation).</li>
<li><b>To keep accounting and tax records</b> (legal obligation).</li>
<li><b>To run giveaways and deliver prizes</b> (contract / your participation).</li>
<li><b>To improve the Services</b> using aggregated, non-identifying information (legitimate interests).</li>
<li><b>To send marketing</b> only where you agreed or where the law otherwise allows (consent / legitimate interests). You can opt out at any time.</li></ul>
<p>You are not legally obliged to give us personal data, but without the data marked as required we cannot create an account or deliver an order.</p>

<h2>3. Who we share data with</h2>
<p>We share personal data only as needed with service providers acting on our behalf, under contracts that protect your data:</p>
<ul><li><b>PayPal</b> (payment processing, fraud prevention). PayPal acts as an independent controller for payment data under its own privacy statement.</li>
<li><b>Vercel Inc.</b> (website hosting and server logs, USA/EU).</li>
<li><b>Upstash</b> (our database for accounts, orders and game saves).</li>
<li><b>Resend</b> (sending service emails).</li>
<li><b>Our suppliers and couriers</b> (name, delivery address and phone number, to make and deliver your order).</li>
<li><b>Content delivery networks</b> used to load fonts, images and scripts (for example Google Fonts, cdnjs and our suppliers' image servers), which may receive your IP address when your browser loads them.</li>
<li><b>Authorities and advisers</b> where required by law, to enforce our Terms, or to protect our rights, users or the public.</li>
<li><b>A buyer or successor</b> if the business is sold or reorganised.</li></ul>
<p>We do not sell your personal data and do not share it for cross-context behavioural advertising.</p>

<h2>4. International transfers</h2>
<p>We operate from Israel and our providers may process data in other countries, including the United States and the European Union. Where required, we rely on appropriate safeguards such as adequacy decisions and standard contractual clauses.</p>

<h2>5. How long we keep data</h2>
<ul><li>Account and game data: while your account is active, and up to 24 months after your last activity, unless you ask us to delete it sooner.</li>
<li>Order and invoice records: 7 years, as required for tax and accounting.</li>
<li>Server logs: typically up to 30 days.</li>
<li>Giveaway entries: until the draw for that month is completed and any prize is delivered, plus a reasonable period for disputes.</li></ul>

<h2>6. Your rights</h2>
<p>Depending on where you live (including under the Israeli Protection of Privacy Law, 5741-1981, the EU/UK GDPR and US state privacy laws such as the CCPA/CPRA), you may have the right to: access your data; correct it; delete it; restrict or object to certain processing; receive a copy in a portable format; withdraw consent at any time; and not be discriminated against for exercising your rights. To exercise them, email <a href="mailto:{EMAIL}">{EMAIL}</a> from the address linked to your account. We will respond within the time required by law (usually 30 days). You may also complain to your data protection authority; in Israel this is the Privacy Protection Authority.</p>

<h2>7. Security</h2>
<p>We use HTTPS encryption, hashed passwords, secure HttpOnly session cookies, access controls and reputable providers. No system is completely secure; if a breach affects your data we will notify you and the authorities as required by law.</p>

<h2>8. Cookies and local storage</h2>
<table style="width:100%;font-size:14px;border-collapse:collapse"><tr><th align="left">Name</th><th align="left">Purpose</th><th align="left">Duration</th></tr>
<tr><td>fm_sess (cookie)</td><td>Keeps you signed in (strictly necessary)</td><td>60 days</td></tr>
<tr><td>Bag, wishlist, language, delivery details, game save (local storage)</td><td>Remember your choices on this device</td><td>Until you clear them</td></tr>
<tr><td>PayPal cookies</td><td>Payment security and fraud prevention, set by PayPal when you pay</td><td>Per PayPal's policy</td></tr></table>
<p>You can clear cookies and local storage in your browser settings at any time; some features may stop working.</p>

<h2>9. Children</h2>
<p>The Services are not directed at children under 13, and we do not knowingly collect their personal data. Users under 18 may use the Services only with the consent and supervision of a parent or guardian. If you believe a child has given us personal data without consent, contact us and we will delete it.</p>

<h2>10. Changes</h2>
<p>We may update this Policy. The “Last updated” date shows the latest version. We will notify registered users of significant changes by email or on the Site.</p>

<h2>11. Contact</h2>
<p>Futbol Mundo · <a href="mailto:{EMAIL}">{EMAIL}</a></p>
'''

RETURNS = f'''
<h2>1. Where we ship</h2>
<p>We ship to most countries worldwide. If we cannot deliver to your address we will cancel the order and refund you in full.</p>
<h2>2. Shipping options and times</h2>
<ul><li><b>Standard delivery:</b> US$9.99 (free on product orders over US$99).</li><li><b>Express delivery:</b> US$14.99.</li><li><b>Next-day delivery:</b> US$29.99, where available.</li></ul>
<p>Orders are usually prepared within 3–7 business days (plus 2–3 days for name and number printing). Delivery times after dispatch depend on the destination, the courier and customs, and are estimates, not guarantees. We will send tracking details when available.</p>
<h2>3. Customs and import charges</h2>
<p>International orders may be subject to customs duties, import taxes and handling fees in your country. These are not included in our prices and are paid by you to the courier or customs authority.</p>
<h2>4. Cancelling an order (right of withdrawal)</h2>
<p>If you are a consumer, you may cancel a distance purchase within <b>14 days</b> from the day you receive the goods (or from the day you receive the order confirmation, whichever is later), by emailing <a href="mailto:{EMAIL}">{EMAIL}</a> with your order number. Return the goods unused, unwashed, with tags and in their original packaging.</p>
<ul><li>For consumers in Israel, under the Consumer Protection Law, a cancellation fee of 5% of the price or ILS 100, whichever is lower, may be charged, except where the law says otherwise (for example cancellation because of a defect or non-delivery). Certain consumers (such as people with disabilities, senior citizens and new immigrants, as defined by law) may have an extended cancellation period of up to 4 months.</li>
<li>For consumers in other countries, the mandatory withdrawal rules of your country apply where they give you more protection.</li>
<li><b>Exceptions:</b> as permitted by law, products personalised to your request (name, number or patches) cannot be cancelled once production has started, unless defective. Opened mystery boxes can only be returned if defective.</li></ul>
<p>Unless the goods are defective or not as described, the cost of returning them is paid by you. We refund the price paid (and the original standard shipping cost where required by law), less any lawful cancellation fee, within 14 days of receiving the returned goods or proof of return, to the original payment method.</p>
<h2>5. Defective, damaged or wrong items</h2>
<p>If your item arrives defective, damaged or different from what you ordered, email <a href="mailto:{EMAIL}">{EMAIL}</a> within 14 days of delivery with your order number and photos. We will offer a replacement or a full refund, including shipping costs, after reviewing the claim.</p>
<h2>6. Lost parcels</h2>
<p>If tracking shows no movement for 30 days, or the courier confirms the parcel is lost, contact us and we will resend the item or refund you. We are not responsible for losses caused by an incorrect address entered by the customer, or for parcels refused or not collected.</p>
<h2>7. Game codes and digital items</h2>
<p>Mundo XI codes included with orders are free extras. They have no cash value and are not refundable. If you cancel an order, any codes from that order may be cancelled and the related Virtual Items removed.</p>
<h2>8. Contact</h2>
<p><a href="mailto:{EMAIL}">{EMAIL}</a> · please include your order number (it starts with FM-).</p>
'''

GIVEAWAY = f'''
<div class="box"><b>NO PURCHASE NECESSARY.</b> A purchase does not increase your chances of winning. Void where prohibited or restricted by law.</div>
<h2>1. Promoter</h2><p>The Futbol Mundo Monthly Jersey Giveaway (the “Giveaway”) is run by {OP} (the “Promoter”). Contact: <a href="mailto:{EMAIL}">{EMAIL}</a>. The Giveaway is not sponsored, endorsed or administered by, or associated with, Instagram, Facebook, Meta, Google, Apple or any club, league or player.</p>
<h2>2. Eligibility</h2><p>Open to individuals aged 18 or older (or minors with the consent of a parent or legal guardian, who must accept the prize on the minor's behalf), living in a country where we ship and where this Giveaway is lawful. The Promoter, its family members and anyone involved in running the Giveaway may not win.</p>
<h2>3. Period</h2><p>Each Giveaway runs for one calendar month, starting at 00:00 on the first day and ending at 23:59 (Israel time) on the last day of the month (the “Period”).</p>
<h2>4. How to enter</h2><p>Create a free account on {SITE} during the Period. Each new account is entered automatically, once, into that month's draw. Limit: one entry per person. Entries made with multiple accounts, false details, bots or other automated means are void.</p>
<h2>5. Draw and prize</h2><p>Within 7 days after the Period ends, one winner is selected at random from all valid entries. The prize is one jersey of the winner's choice from the store (up to a retail value of US$60), including standard shipping. No cash alternative. The Promoter may substitute a prize of equal or greater value if the chosen item is unavailable.</p>
<h2>6. Winner notification</h2><p>The winner is notified by email at the address on their account and must reply within 14 days with their choice, size and delivery details, and any proof of eligibility we reasonably request. If the winner does not respond in time, is ineligible or cannot be contacted, the prize is forfeited and another winner may be drawn.</p>
<h2>7. Taxes and delivery</h2><p>Any taxes, customs or import charges on the prize are the winner's responsibility. Delivery is subject to our <a href="/legal/returns.html">Shipping &amp; Returns Policy</a>.</p>
<h2>8. Publicity</h2><p>With the winner's consent, the Promoter may publish the winner's first name and country.</p>
<h2>9. General</h2><p>The Promoter may cancel, suspend or modify the Giveaway if fraud, technical failure or any other factor beyond its control affects its fairness, and may disqualify anyone who tampers with the entry process. To the extent permitted by law, the Promoter is not liable for any loss arising from participation or from the prize. Personal data is processed under our <a href="/legal/privacy.html">Privacy Policy</a> for running the Giveaway. These rules are governed by the laws of Israel, subject to any mandatory local law where the entrant lives.</p>
'''

ACCESS = f'''
<p>We want everyone to be able to shop and play. We are working to make {SITE} accessible in line with the Israeli Equal Rights for Persons with Disabilities (Service Accessibility Adjustments) Regulations, 5773-2013, and the Web Content Accessibility Guidelines (WCAG) 2.1, level AA, as reflected in Israeli Standard IS 5568.</p>
<h2>What we have done</h2><ul><li>Keyboard navigation for the main store pages and checkout.</li><li>Text alternatives for important images and buttons.</li><li>Readable contrast and scalable text; the site works with browser zoom.</li><li>The site is available in several languages, including Hebrew and Arabic with right-to-left layout.</li><li>The Mundo XI 3D views have a 2D option, and animations respect the “reduce motion” setting of your device.</li></ul>
<h2>Known limitations</h2><p>Some parts of the Mundo XI game (especially the real-time match controls and 3D views) and some supplier product photos may not yet be fully accessible. Payment pages are provided by PayPal and follow PayPal's accessibility standards.</p>
<h2>Contact the accessibility coordinator</h2><p>If you have difficulty using any part of the site, or want to suggest an improvement, email <a href="mailto:{EMAIL}">{EMAIL}</a>. Please describe the problem and the page. We will reply as soon as possible and offer help completing your order by another way if needed.</p>
'''
for fn,t,b in [("terms.html","Terms of Service",TERMS),("privacy.html","Privacy Policy",PRIVACY),("returns.html","Shipping & Returns",RETURNS),("giveaway.html","Giveaway Rules",GIVEAWAY),("accessibility.html","Accessibility Statement",ACCESS)]:
    open(f"legal/{fn}","w").write(page(fn,t,b))
print("ok")
