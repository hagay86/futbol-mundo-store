import json
P=json.load(open('scripts/uriel_products.json')); C={r[0]:r for r in json.load(open('scripts/uriel_colors.json'))}
STRIPED={('Barcelona','Home'),('Inter Milan','Home'),('AC Milan','Home'),('Juventus','Home'),('Newcastle United','Home'),('Atletico Madrid','Home'),('Athletic Bilbao','Home'),('Club Brugge','Home'),('PSV Eindhoven','Home'),('FC Porto','Home'),('Sunderland','Home'),('Crystal Palace','Home'),('Lens','Home'),('Celta Vigo','Home'),('Bologna','Home'),('Real Betis','Home'),('Girona','Home'),('Malaga','Home'),('Feyenoord','Home'),('Galatasaray','Home'),('Brentford','Home')}
def h2r(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def d(a,b): return sum((x-y)**2 for x,y in zip(h2r(a),h2r(b)))**.5
def lum(h): r,g,b=h2r(h); return .299*r+.587*g+.114*b
def shade(h,f):
    r,g,b=h2r(h); return '#%02x%02x%02x'%tuple(max(0,min(255,int(v*f))) for v in (r,g,b))
specs=[]
for i,p in enumerate(P):
    if i not in C: continue
    _,mid,a,b,s,pat,share=C[i]
    trim=b if b and d(a,b)>70 else (shade(a,.55) if lum(a)>150 else '#f2f2f2' if lum(a)<90 else shade(a,1.35))
    sleeve=s if d(a,s)>60 else a
    stripes=(p['team'],p['kit']) in STRIPED and b and d(a,b)>70
    if stripes: sleeve=a if d(sleeve,b)<60 and d(sleeve,a)>60 else sleeve
    specs.append({'i':i,'mid':mid,'team':p['team'],'kit':p['kit'],'variant':p['variant'],'league':p['league'],'a':a,'b':trim,'s':sleeve,'stripes':bool(stripes)})
json.dump(specs,open('scripts/jersey_specs.json','w'),indent=0)
print(len(specs), sum(s['stripes'] for s in specs))
