import http from 'node:http'; import { readFileSync } from 'node:fs';
const ROOT=process.env.ROOT; process.chdir(ROOT);
process.env.STRIPE_SECRET_KEY='sk_test_dummy'; process.env.KV_REST_API_URL='http://localhost:8787/__redis'; process.env.KV_REST_API_TOKEN='t'; process.env.RESEND_API_KEY='re_x'; process.env.ADMIN_EMAIL='test@example.com'; process.env.PAYPAL_CLIENT_ID='cid'; process.env.PAYPAL_SECRET='sec'; process.env.PAYPAL_ENV='sandbox'; let PPBODY=null, CAPS=0;
const DB=new Map(); const EMAILS=[]; let lastBody='';
function cmd([c,...a]){ c=c.toUpperCase();
  if(c==='GET') return DB.has(a[0])?DB.get(a[0]):null;
  if(c==='SET'){ if(a.includes('NX')&&DB.has(a[0])) return null; DB.set(a[0],a[1]); return 'OK'; }
  if(c==='DEL'){ DB.delete(a[0]); return 1; }
  if(c==='INCR'){ const v=(+DB.get(a[0])||0)+1; DB.set(a[0],String(v)); return v; }
  if(c==='EXPIRE') return 1;
  if(c==='LPUSH'){ const l=JSON.parse(DB.get(a[0])||'[]'); l.unshift(a[1]); DB.set(a[0],JSON.stringify(l)); return l.length; }
  if(c==='LRANGE'){ return JSON.parse(DB.get(a[0])||'[]').slice(+a[1], +a[2]+1); } }
const realFetch=globalThis.fetch;
globalThis.fetch=async(url,init={})=>{ url=String(url);
  if(url.startsWith('http://localhost:8787/__redis')) return {ok:true,json:async()=>({result:cmd(JSON.parse(init.body))})};
  if(url.startsWith('https://api.resend.com')){ EMAILS.push(JSON.parse(init.body)); return {ok:true,json:async()=>({id:'e'})}; }
  if(url.startsWith('https://api-m.sandbox.paypal.com')){ const u=new URL(url); let j;
    if(u.pathname==='/v1/oauth2/token') j={access_token:'tok',expires_in:3000};
    else if(u.pathname==='/v2/checkout/orders' && init.method==='POST'){ PPBODY=JSON.parse(init.body); j={id:'PPORDER1234567',links:[{rel:'payer-action',href:'http://localhost:8787/?pp=1&token=PPORDER1234567&PayerID=X'}]}; }
    else if(u.pathname.endsWith('/capture')){ CAPS++; if(CAPS>1) return {ok:false,status:422,json:async()=>({name:'UNPROCESSABLE_ENTITY',details:[{issue:'ORDER_ALREADY_CAPTURED'}]})}; j={status:'COMPLETED',payer:{email_address:'test@example.com'},purchase_units:[{payments:{captures:[{status:'COMPLETED',amount:{value:PPBODY.purchase_units[0].amount.value}}]},shipping:{name:{full_name:'Test Buyer'},address:{address_line_1:'1 Main St',admin_area_2:'Tel Aviv',postal_code:'61000',country_code:'IL'}}}]}; }
    else j={status:'COMPLETED',payer:{email_address:'test@example.com'},purchase_units:[{payments:{captures:[{status:'COMPLETED',amount:{value:PPBODY.purchase_units[0].amount.value}}]}}]};
    return {ok:true,status:200,json:async()=>j}; }
  if(!url.startsWith('https://api.stripe.com')) return realFetch(url,init);
  const u=new URL(url); let j;
  if(u.pathname==='/v1/checkout/sessions'){ lastBody=decodeURIComponent(init.body); const uid=(lastBody.match(/metadata\[uid\]=([^&]*)/)||[])[1]; DB.set('__uid',uid); j={url:'http://localhost:8787/?order=cs_test_abc123'}; }
  else if(u.pathname.endsWith('/line_items')) j={data:[{description:'Shirt A',quantity:2,amount_total:6170}]};
  else if(u.pathname.startsWith('/v1/checkout/sessions/')) j={id:'cs_test_abc123',payment_status:'paid',metadata:{order:'FM-ABC1234',shirts:'2',pts:'0',scarf:'1',uid:DB.get('__uid')||''},amount_total:7169,amount_subtotal:6170,customer_details:{email:DB.get('__uid')||'t@x.com'},line_items:{data:[{description:'Shirt A',quantity:2,amount_total:6170}]}};
  else if(u.pathname==='/v1/payment_intents/search') j={data:[{status:'succeeded',latest_charge:'ch_1',metadata:{order:'FM-ABC1234',status:'Shipped',tracking:'DHL123'},created:1793270000,amount:7169}]};
  else if(u.pathname.startsWith('/v1/charges/')) j={billing_details:{email:'t@x.com'}};
  else if(u.pathname.startsWith('/v1/events/')) j={type:'checkout.session.completed',data:{object:{id:'cs_test_abc123'}}};
  return {ok:true,status:200,json:async()=>j}; };
const H={}; for (const n of ['catalog','ingest','checkout','order','redeem','track','auth','save','webhook','geo','status','admin']) H['/api/'+n]=(await import(ROOT+'/api/'+n+'.js')).default;
http.createServer(async(req,res)=>{ const p=new URL(req.url,'http://x').pathname;
  if(p==='/__last'){res.end(lastBody);return;}
  if(p==='/__pp'){res.end(JSON.stringify(PPBODY));return;}
  if(p==='/__emails'){res.end(JSON.stringify(EMAILS.map(e=>({to:e.to,subject:e.subject,from:e.from,at:e.scheduled_at,codes:(e.html.match(/MX-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{8}/g)||[])}))));return;}
  if(p==='/__get'){res.end(String(DB.get(new URL(req.url,'http://x').searchParams.get('k'))));return;}
  if(p==='/__db'){res.end(JSON.stringify([...DB.keys()]));return;}
  if(p==='/thank-you'){res.setHeader('Content-Type','text/html');res.end(readFileSync(ROOT+'/thank-you.html'));return;}
  if(p==='/__mail'){const i=+new URL(req.url,'http://x').searchParams.get('i');res.setHeader('Content-Type','text/html');res.end(EMAILS[i]?EMAILS[i].html:'none');return;}
  if(p.startsWith('/a/')){ try{ const r=await realFetch('https://www.futbolmundoshop.com'+p); res.setHeader('Content-Type',r.headers.get('content-type')||'image/png'); res.end(Buffer.from(await r.arrayBuffer())); }catch(e){res.statusCode=404;res.end();} return; }
  if(H[p]) return H[p](req,res);
  if(p.startsWith('/jerseys/')){res.setHeader('Content-Type','image/webp');res.end(readFileSync(ROOT+p));return;}
  if(p.startsWith('/legal/')){res.setHeader('Content-Type','text/html');res.end(readFileSync(ROOT+p));return;}
  if(p.startsWith('/i18n/')){ try{ res.setHeader('Content-Type','application/json'); res.end(readFileSync(ROOT+p)); }catch(e){ res.statusCode=404; res.end('{}'); } return; }
  res.setHeader('Content-Type','text/html'); res.end(readFileSync(ROOT+'/index.html')); }).listen(8787,()=>console.log('up'));
