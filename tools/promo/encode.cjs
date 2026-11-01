const fs=require("fs"),{execFileSync}=require("child_process");const ff="ffmpeg";
const fr=fs.readdirSync('fr1').filter(f=>f.endsWith('.jpg')).sort();
const t=fr.map(f=>+f.split('_')[1].replace('.jpg',''));
let list='';fr.forEach((f,i)=>{const d=Math.max(0.02,((t[i+1]??t[i]+1500)-t[i])/1000);list+=`file 'fr1/${f}'\nduration ${d.toFixed(3)}\n`;});list+=`file 'fr1/${fr[fr.length-1]}'\n`;
fs.writeFileSync('list.txt',list);
execFileSync(ff,['-y','-f','concat','-safe','0','-i','list.txt','-vf','scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,fps=30,format=yuv420p','-c:v','libx264','-crf','19','-preset','veryfast','-movflags','+faststart','screen.mp4'],{stdio:'inherit'});
// contact sheet every ~4s for review
execFileSync(ff,['-y','-i','screen.mp4','-vf','fps=1/4,scale=180:-1,tile=8x4','-frames:v','1','-q:v','6','sheet.jpg'],{stdio:'inherit'});
console.log('frames',fr.length,'dur',(t[t.length-1]-t[0])/1000);
