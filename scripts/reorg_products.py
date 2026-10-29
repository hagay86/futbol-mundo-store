import re,json,collections,sys
P_='/home/claude/futbol-mundo-store/index.html'
s=open(P_,encoding='utf-8').read()
m=re.search(r'const PRODUCTS = (\[.*?\]);\n',s,re.S); P=json.loads(m.group(1))
NFL=r'arizona cardinals|tennessee titans|new orleans saints|new york giants game|buccaneers|philadelphia eagles|kansas city chiefs|dallas cowboys|new england patriots|49ers|green bay packers|pittsburgh steelers|las vegas raiders|denver broncos|seattle seahawks|los angeles rams|baltimore ravens|cincinnati bengals|cleveland browns|buffalo bills|miami dolphins|new york jets|washington commanders|chicago bears|detroit lions|minnesota vikings|atlanta falcons|carolina panthers|houston texans|indianapolis colts|jacksonville jaguars|\bnfl\b|super bowl'
NBA=r'lakers|celtics|warriors|chicago bulls|miami heat|knicks|brooklyn nets|grizzlies|bucks|phoenix suns|mavericks|nuggets|76ers|raptors|clippers|spurs|rockets|thunder|utah jazz|blazers|timberwolves|pelicans|hornets|atlanta hawks|orlando magic|pistons|pacers|cavaliers|wizards|\bnba\b|swingman|avdija'
NHL=r'st\. louis blues|sabres|islanders|devils|blue jackets|coyotes|san jose sharks|hurricanes|kraken|predators|dallas stars|florida panthers|penguins|bruins|maple leafs|canadiens|oilers|calgary flames|canucks|red wings|blackhawks|avalanche|golden knights|washington capitals|philadelphia flyers|\bnhl\b|stanley cup'
MLB=r'angels jersey|san francisco giants|orioles|nationals jersey|athletics jersey|minnesota twins|yankees|red sox|dodgers|new york mets|cubs|astros|padres|mariners|atlanta braves|phillies|blue jays'
ACC=r'duvet|blanket|phone case|scarf|floor mat|doormat|labubu|trionda|knockout football|jabulani|ucl football|orbita|prestige football'
log=collections.Counter(); out=[]
for p in P:
    n=p['n'].lower()
    if re.search(NFL,n): log['deleted NFL']+=1; continue
    old=p['c']
    if 'x mlb' in n: pass
    elif re.search(MLB,n): p['c']='MLB'
    elif re.search(NHL,n): p['c']='NHL'
    elif re.search(NBA,n) and 'red bulls' not in n: p['c']='NBA'
    elif 'rugby' in n: p['c']='Rugby'
    elif re.search(ACC,n): p['c']='Accessories'
    elif re.search(r'yeezy|air jordan 4|jordan 1|dunk low|calm slide|recovery slide|kobe 4|kobe dunk|boots?\b|mercurial|predator|f50',n) and 'jersey' not in n: p['c']='Shoes'
    elif p['c']=='Shoes' and 'brazil' in n: p['c']='National Teams'
    elif p['c']=='Shoes' and 't-shirt' in n and 'barcelona' in n: p['c']='La Liga'
    elif p['c']=='Accessories' and 'inter miami' in n: p['c']='Other Leagues'
    if p['c']!=old: log[f'{old} -> {p["c"]}']+=1
    out.append(p)
s=s[:m.start(1)]+json.dumps(out,ensure_ascii=False,separators=(',',':'))+s[m.end(1):]
def rep(a,b):
    global s
    assert s.count(a)==1,a; s=s.replace(a,b)
rep("if (matched && !['New Arrivals','Kids','Retro','Other Leagues','NBA','Shoes'].includes(p.c)) p.c = matched.cat;",
    "if (matched && !['New Arrivals','Kids','Retro','Other Leagues','NBA','NHL','MLB','Rugby','Accessories','Shoes'].includes(p.c)) p.c = matched.cat;")
rep("const SHOP_CATS = ['All','New Arrivals','Retro','Premier League','La Liga','Serie A','Bundesliga','Ligue 1','National Teams','Other Leagues','Kids','NBA','NHL','Shoes','Accessories'];",
    "const SHOP_CATS = ['All','New Arrivals','Retro','Premier League','La Liga','Serie A','Bundesliga','Ligue 1','National Teams','Other Leagues','Kids','Shoes','Accessories','NBA','NHL','MLB','Rugby'];")
open(P_,'w',encoding='utf-8').write(s)
for k,v in sorted(log.items()): print(v,k)
print('total',len(out))
