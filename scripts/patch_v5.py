import sys
P='/home/claude/futbol-mundo-store/index.html'
s=open(P,encoding='utf-8').read()
def rep(old,new,count=1):
    global s
    n=s.count(old)
    if n!=count: sys.exit(f'expected {count} of {old[:70]!r}, found {n}')
    s=s.replace(old,new)
init_v4 = s[s.index("// ---------------- Init ----------------\n(function(){\n  const gh = $('.g-hero')"):s.index("(function(){ const id = new URLSearchParams(location.search).get('order'); if (id) handleOrderReturn(id); })();\n")]
rep(init_v4 + "(function(){ const id = new URLSearchParams(location.search).get('order'); if (id) handleOrderReturn(id); })();\n", "// (init moved to v5)\n")
css=open('scripts/v5.css',encoding='utf-8').read(); js=open('scripts/v5.js',encoding='utf-8').read()
rep('</head>','<style>\n'+css+'\n</style>\n</head>')
rep('</body>','<script>\n'+js+'\n</script>\n</body>')
open(P,'w',encoding='utf-8').write(s); print('ok',len(s))
