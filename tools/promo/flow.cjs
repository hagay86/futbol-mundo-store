// Scripted Mundo XI flow. mode=shots (stills) or rec (CDP screencast frames)
const {chromium}=require('playwright');const fs=require('fs');const C=require('./common.cjs');process.chdir(__dirname);
const MODE=process.argv[2]||'shots';
(async()=>{
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:412,height:732},deviceScaleFactor:2.62,isMobile:true,hasTouch:true});
const pg=await ctx.newPage();const ext=new Set();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await C.setup(pg,ext);
let frames=[],cdp,t0=Date.now(),marks=[];
const mark=n=>{marks.push([n,(Date.now()-t0)/1000]);};
const shot=async n=>{mark(n); if(MODE==='shots') await pg.screenshot({path:'s-'+n+'.png'});};
const W=ms=>pg.waitForTimeout(ms);
const typeSlow=async(sel,txt)=>{await pg.click(sel);await pg.type(sel,txt,{delay:55});};
// buy $200 off camera in a helper account later; first the visible flow
await pg.goto('http://localhost:8787/#game');await W(1800);
await pg.evaluate(()=>{try{localStorage.setItem('fm_cookie','1')}catch(e){}; document.querySelectorAll('.cookie,#cookie,.cookie-bar').forEach(e=>e.remove());});
if(MODE==='rec'){cdp=await ctx.newCDPSession(pg);cdp.on('Page.screencastFrame',async f=>{frames.push([Date.now(),f.data]);cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{});});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:88,maxWidth:1080,maxHeight:1920,everyNthFrame:1});}
t0=Date.now();
await shot('01-landing'); await W(1500);
await pg.evaluate(()=>window.scrollBy({top:350,behavior:'smooth'}));await W(1200);
await pg.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));await W(600);
await pg.evaluate(()=>openAuth('signup'));await W(700);await shot('02-signup');
await typeSlow('#au-name','Hagay');await typeSlow('#au-email','hagay'+Date.now()%10000+'@gmail.com');await typeSlow('#au-pw','MundoXI2026!');
await pg.check('#au-terms');await W(300);await pg.click('#au-go');await W(1500);await shot('03-after-signup');
await pg.evaluate(()=>{G.tut=9;save();document.querySelectorAll('.tut-ov,.tut,#tut').forEach(e=>e.remove());closeInfo&&closeInfo();});
await pg.evaluate(()=>grantWelcome());await W(1300);await shot('04-pack');
await pg.click('#po-pack');await W(1200);await shot('05-burst');await W(5200);await shot('06-cards');await W(800);
await pg.evaluate(()=>{const el=document.querySelector('.po-cards');if(el)el.scrollTo({top:el.scrollHeight,behavior:'smooth'});});await W(1200);
await pg.click('#po-actions .btn');await W(1200);await shot('07-mygifts');
await pg.click('text=Choose my free jersey');await W(1600);await shot('08-giftshop');
await pg.evaluate(()=>window.scrollBy({top:500,behavior:'smooth'}));await W(1300);await shot('09-giftshop-scroll');
// select a jersey at $0
await pg.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));await W(500);
await pg.evaluate(()=>toggleMenu(true));await W(700);
const ms='#mnav input[type=search]';await pg.click(ms,{force:true});await pg.type(ms,'Real Madrid',{delay:60});await W(300);await pg.press(ms,'Enter');await W(1700);await shot('10-search');
await pg.evaluate(()=>window.scrollBy({top:300,behavior:'smooth'}));await W(1300);await shot('11-search2');
await pg.evaluate(()=>{const p=PRODUCTS.find(p=>/Real Madrid Home Men Jersey 26\/27/.test(p.n));openP(p.id);});await W(1500);await shot('12-pdp');
await pg.evaluate(()=>document.querySelector('#pdp-overlay .pdp-body, #pdp-overlay')?.scrollBy?.({top:250,behavior:'smooth'}));await W(900);
await pg.evaluate(()=>{const b=[...document.querySelectorAll('#pdp-sizes .sz')].find(e=>e.textContent.trim()==='M')||document.querySelector('#pdp-sizes .sz');b.scrollIntoView({block:'center',behavior:'smooth'});});await W(800);
await pg.evaluate(()=>{const b=[...document.querySelectorAll('#pdp-sizes .sz')].find(e=>e.textContent.trim()==='M')||document.querySelector('#pdp-sizes .sz');b.click();});await W(700);await shot('13-size');
await pg.evaluate(()=>document.querySelector('#pdp-overlay .btn-cart').click());await W(2000);await shot('14-bag');
await W(1500);
// ---- off camera: a real paid order -> gold packs + gifts unlock
const r=await pg.evaluate(async()=>{
  try{toggleCart(false)}catch(e){}; document.querySelectorAll('.cart-drawer.open,#cart.open').forEach(e=>e.classList.remove('open'));
  const ps=PRODUCTS.filter(p=>isShirt(p)).slice(0,6); const old=cart; cart=ps.map(p=>({n:p.n,p:p.p,img:p.i,sz:'M',q:1,pid:p.id}));
  const r=await (await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:coItems(),ship:'standard',pay:'card',sdk:1,addr:{name:'Hagay D',phone:'+972 50 123 4567',line1:'Rothschild 1',city:'Tel Aviv',country:'IL'}})})).json();
  cart=old; renderCart(); return r;});
if(r.id) await pg.evaluate(async id=>{await fetch('/api/order?id=pp:'+id);await loadMe();},r.id);
console.log('me',await pg.evaluate(()=>JSON.stringify({spent:ME.user.spent,un:(ME.unlocked||[]).length})));
await pg.evaluate(()=>{G.packs.push({type:'gold'},{type:'gold'},{type:'gold'});G.points=46000;save();try{sessionStorage.setItem('fm_xi_in','1')}catch(e){};closeInfo&&closeInfo();go('game');gTab('packs');renderPacks();});
await W(400);await pg.evaluate(()=>document.querySelector('#packs-main').scrollIntoView({block:'start'}));await pg.evaluate(()=>window.scrollBy(0,-70));await W(1300);await shot('15-mypacks');
// open gold packs
for(let k=0;k<2;k++){
  await pg.evaluate(()=>openPack(0));await W(1300);await shot('16-goldpack'+k);
  await pg.click('#po-pack');await W(7500);await shot('17-goldcards'+k);
  await pg.evaluate(()=>{const b=[...document.querySelectorAll('#po-actions .btn, .po-actions .btn')].pop(); if(b) b.click(); else closePack();});await W(900);
}
// gift shop
await pg.evaluate(()=>{try{closePack()}catch(e){};gTab('rewards');renderRewards();});await W(300);
await pg.evaluate(()=>document.querySelector('#rewards').scrollIntoView({block:'start'}));await pg.evaluate(()=>window.scrollBy(0,-90));await W(1500);await shot('18-gifts');
await pg.evaluate(()=>{const b=[...document.querySelectorAll('#rewards .reward')].find(e=>/Free jersey/.test(e.textContent)&&!/My gifts/.test(e.textContent));b&&b.scrollIntoView({behavior:'smooth',block:'center'});});await W(1500);await shot('19-gift-jersey');
await pg.evaluate(()=>claimGift(GIFTS.findIndex(g=>g.name==='Free jersey')));await W(2000);await shot('20-claimed');
await pg.evaluate(()=>{const g=openGifts().find(g=>g.name==='Free jersey');GP={gid:g.id,slot:0,q:''};openGiftPicker(g.id,0);});await W(800);
await pg.type('#gp-q','Barcelona',{delay:70});await W(1300);await shot('21-picker');
await pg.evaluate(()=>{const id=+document.querySelector('.gp-item').getAttribute('onclick').match(/\d+/)[0];gpChoose(id);});await W(1200);await shot('22-size');
await pg.evaluate(()=>{const s=[...document.querySelectorAll('.gp-size')].find(e=>e.textContent.trim()==='L')||document.querySelectorAll('.gp-size')[1];s.click();});await W(1500);await shot('23-address');
await pg.evaluate(()=>{const set=(id,v)=>{const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}};
  ['co-name','ad-name'].forEach(i=>set(i,'Hagay D'));});
const ids=await pg.evaluate(()=>[...document.querySelectorAll('#info-modal-body input, #info-modal-body select')].map(e=>e.id));console.log('addr ids',ids.join(','));
if(MODE==='rec'){await cdp.send('Page.stopScreencast');}
fs.writeFileSync('marks.json',JSON.stringify(marks));
if(MODE==='rec'){fs.mkdirSync('fr1',{recursive:true});frames.forEach(([t,d],i)=>fs.writeFileSync(`fr1/${String(i).padStart(5,'0')}_${t-t0}.jpg`,Buffer.from(d,'base64')));console.log('frames',frames.length);}
fs.writeFileSync('ext.txt',[...ext].join('\n'));console.log('ext',ext.size,errs);
await b.close();})().catch(e=>{console.log('ERR',e.message);process.exit(1)});
