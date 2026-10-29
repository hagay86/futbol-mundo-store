const {chromium}=require('playwright');const fs=require('fs');
const SP='/tmp/claude-0/-home-claude/4131cfb0-944e-56d2-8075-b16f78c07f07/scratchpad';
const THREE=fs.readFileSync(SP+'/three/node_modules/three/build/three.min.js','utf8');
const specs=JSON.parse(fs.readFileSync('/home/claude/futbol-mundo-store/scripts/jersey_specs.json','utf8'));
const only=process.argv[2]?process.argv[2].split(',').map(Number):null;
const html=`<html><body style="margin:0;background:#fff"><canvas id="c" width="900" height="900"></canvas><script>${THREE}</script><script>
const T=THREE, R=new T.WebGLRenderer({canvas:document.getElementById('c'),antialias:true,preserveDrawingBuffer:true});
R.setSize(900,900,false); R.outputEncoding=T.sRGBEncoding; R.toneMapping=T.ACESFilmicToneMapping; R.toneMappingExposure=1.05; R.shadowMap.enabled=true; R.shadowMap.type=T.PCFSoftShadowMap;
function bg(){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');const g=x.createRadialGradient(256,200,40,256,256,380);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#e3e6ea');x.fillStyle=g;x.fillRect(0,0,512,512);return new T.CanvasTexture(c)}
function outline(x,S,Y,long){x.beginPath();x.moveTo(S(.38),Y(.965));x.quadraticCurveTo(S(.5),Y(.86),S(.62),Y(.965));x.lineTo(S(.78),Y(.925));x.quadraticCurveTo(S(.86),Y(.89),S(.9),Y(.84));
 if(long){x.lineTo(S(1.02),Y(.30));x.lineTo(S(.92),Y(.27));x.lineTo(S(.79),Y(.66));}else{x.lineTo(S(.995),Y(.70));x.lineTo(S(.885),Y(.6));x.lineTo(S(.785),Y(.67));}
 x.quadraticCurveTo(S(.77),Y(.36),S(.785),Y(.04));x.quadraticCurveTo(S(.5),Y(.0),S(.215),Y(.04));x.quadraticCurveTo(S(.23),Y(.36),S(.215),Y(.67));
 if(long){x.lineTo(S(.08),Y(.27));x.lineTo(S(-.02),Y(.30));}else{x.lineTo(S(.115),Y(.6));x.lineTo(S(.005),Y(.70));}
 x.lineTo(S(.1),Y(.84));x.quadraticCurveTo(S(.14),Y(.89),S(.22),Y(.925));x.closePath();}
function arms(x,S,Y,long){x.beginPath();
 if(long){x.moveTo(S(.215),Y(.67));x.lineTo(S(.08),Y(.27));x.lineTo(S(-.02),Y(.30));x.lineTo(S(.1),Y(.84));x.quadraticCurveTo(S(.14),Y(.89),S(.22),Y(.925));x.closePath();
  x.moveTo(S(.785),Y(.67));x.lineTo(S(.92),Y(.27));x.lineTo(S(1.02),Y(.30));x.lineTo(S(.9),Y(.84));x.quadraticCurveTo(S(.86),Y(.89),S(.78),Y(.925));x.closePath();}
 else{x.moveTo(S(.215),Y(.67));x.lineTo(S(.115),Y(.6));x.lineTo(S(.005),Y(.70));x.lineTo(S(.1),Y(.84));x.quadraticCurveTo(S(.14),Y(.89),S(.22),Y(.925));x.closePath();
  x.moveTo(S(.785),Y(.67));x.lineTo(S(.885),Y(.6));x.lineTo(S(.995),Y(.70));x.lineTo(S(.9),Y(.84));x.quadraticCurveTo(S(.86),Y(.89),S(.78),Y(.925));x.closePath();}}
const L0=-.06,L1=1.06,W=L1-L0;
function tex(sp,long,kids){const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');
 const yb=kids?-.36:L0, HH=kids?(L1-(-.36)):W; const S=v=>(v-L0)/W*1024, Y=v=>(1-(v-yb)/HH)*1024;
 x.save();outline(x,S,Y,long);x.clip();
 x.fillStyle=sp.a;x.fillRect(0,0,1024,1024);
 if(sp.stripes){x.fillStyle=sp.b;for(let i=0;i<5;i++){const cx=.215+(i+.5)*(.57/5);x.fillRect(S(cx-.032),0,S(cx+.032)-S(cx-.032),1024);}}
 x.fillStyle=sp.s;arms(x,S,Y,long);x.fill();
 x.strokeStyle=sp.b;x.lineWidth=20;x.beginPath();if(long){x.moveTo(S(-.02),Y(.31));x.lineTo(S(.09),Y(.275));x.moveTo(S(.91),Y(.275));x.lineTo(S(1.02),Y(.31));}else{x.moveTo(S(.005),Y(.70));x.lineTo(S(.115),Y(.6));x.moveTo(S(.885),Y(.6));x.lineTo(S(.995),Y(.70));}x.stroke();
 x.lineWidth=30;x.beginPath();x.moveTo(S(.38),Y(.965));x.quadraticCurveTo(S(.5),Y(.86),S(.62),Y(.965));x.stroke();
 x.globalAlpha=.8;x.lineWidth=9;x.beginPath();x.moveTo(S(.232),Y(.655));x.quadraticCurveTo(S(.247),Y(.36),S(.232),Y(.05));x.moveTo(S(.768),Y(.655));x.quadraticCurveTo(S(.753),Y(.36),S(.768),Y(.05));x.stroke();x.globalAlpha=1;
 const bx=S(.635),by=Y(.785);x.fillStyle=sp.b;x.beginPath();x.moveTo(bx-24,by-28);x.lineTo(bx+24,by-28);x.lineTo(bx+24,by+5);x.quadraticCurveTo(bx,by+34,bx-24,by+5);x.closePath();x.fill();
 x.fillStyle=sp.a;x.beginPath();for(let k=0;k<5;k++){const a1=-Math.PI/2+k*2*Math.PI/5,a2=a1+Math.PI/5;x.lineTo(bx+13*Math.cos(a1),by-7+13*Math.sin(a1));x.lineTo(bx+5.5*Math.cos(a2),by-7+5.5*Math.sin(a2));}x.closePath();x.fill();
 x.restore();
 if(kids){x.save();x.beginPath();x.moveTo(S(.27),Y(.0));x.lineTo(S(.73),Y(.0));x.lineTo(S(.78),Y(-.30));x.lineTo(S(.53),Y(-.32));x.lineTo(S(.5),Y(-.14));x.lineTo(S(.47),Y(-.32));x.lineTo(S(.22),Y(-.30));x.closePath();x.fillStyle=sp.stripes?'#1b1f2a':sp.b;x.fill();x.restore();}
 const id=x.getImageData(0,0,1024,1024),D=id.data;for(let i=0;i<D.length;i+=4){if(!D[i+3])continue;const px=(i/4)%1024,py=Math.floor(i/4/1024);const m=((px%6<2)&&(py%6<2))?-6:0;const n=(Math.random()-.5)*5+m;D[i]+=n;D[i+1]+=n;D[i+2]+=n;}x.putImageData(id,0,0);
 const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=8;return t;}
function shadowTex(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const g=x.createRadialGradient(128,128,10,128,128,128);g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,256,256);return new T.CanvasTexture(c);}
window.render=(sp)=>{const sc=new T.Scene();sc.background=bg();
 const cam=new T.PerspectiveCamera(30,1,.1,50);cam.position.set(0,0,3.1);cam.lookAt(0,0,0);
 sc.add(new T.HemisphereLight(0xffffff,0xa7b0ba,.8));const k=new T.DirectionalLight(0xffffff,1.0);k.position.set(-1.8,2.0,2.6);sc.add(k);
 const f=new T.DirectionalLight(0xffffff,.35);f.position.set(2,.4,1.6);sc.add(f);
 const long=sp.variant==='Long Sleeve', kids=sp.variant==='Kids Kit';
 const yb=kids?-.36:L0, H=kids?(L1-(-.36)):W; const g=new T.PlaneGeometry(W,H,180,180);
 const p=g.attributes.position;for(let i=0;i<p.count;i++){const X=p.getX(i)+ (L0+W/2), Yv=p.getY(i)+(yb+H/2);
   const tx=Math.max(0,Math.min(1,(X-.21)/.58)), torso=Math.sin(Math.PI*tx);
   let z=.11*torso*(.8+.2*Math.sin(Math.PI*Math.max(0,Math.min(1,Yv)))); if(Yv<0) z=.05*Math.sin(Math.PI*Math.max(0,Math.min(1,(X-.22)/.56)));
   z+=.0025*Math.sin(Yv*21+X*5)+.0015*Math.sin(X*17-Yv*9);
   const arm=X<.21?(.21-X):X>.79?(X-.79):0; z-= arm*.25;
   p.setXYZ(i,X,Yv,z);} g.computeVertexNormals();
 const mat=new T.MeshStandardMaterial({map:tex(sp,long,kids),roughness:.8,metalness:0,alphaTest:.5,side:T.DoubleSide});
 const m=new T.Mesh(g,mat);const grp=new T.Group();grp.add(m);
 const cx=.5, cy=kids?.32:.47;m.position.set(-cx,-cy,0);
 grp.scale.setScalar(kids?1.12:1.45);grp.rotation.set(-.05,-.30,.015);sc.add(grp);
 const sh=new T.Mesh(new T.PlaneGeometry(1.6,1.9),new T.MeshBasicMaterial({map:shadowTex(),transparent:true,depthWrite:false}));sh.position.set(.12,-.06,-.4);sc.add(sh);
 R.render(sc,cam);return document.getElementById('c').toDataURL('image/webp',.86);};
</script></body></html>`;
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:900,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(html);await p.waitForTimeout(300);
 for(const sp of specs){ if(only&&!only.includes(sp.i)) continue; const d=await p.evaluate(s=>render(s),sp); fs.writeFileSync('/home/claude/futbol-mundo-store/jerseys/'+sp.mid+'.webp',Buffer.from(d.split(',')[1],'base64')); }
 console.log('done',errs);await b.close();})();
